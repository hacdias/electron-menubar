const path = require('path')
const Positioner = require('electron-positioner')
const merge = require('lodash.merge')
const {EventEmitter} = require('events')
const electron = require('electron')
const {app, Tray, BrowserWindow} = electron

const defaults = {
  // TODO: WIndows: is the taskbar at the top or at the bottom?
  windowPosition: (process.platform === 'win32') ? 'trayBottomRight' : 'trayCenter',
  preloadWindow: false,
  showDockIcon: false,
  showOnRightClick: false,
  showOnAllWorkspaces: true,
  tooltip: '',
  window: {
    width: 400,
    height: 400,
    show: false,
    frame: false
  }
}

/**
 * Class Menubar.
 */
class Menubar extends EventEmitter {
  constructor (opts) {
    super()

    if (typeof opts !== 'object') {
      opts = {}
    }

    opts = merge(defaults, opts)

    if (!path.isAbsolute(opts.dir)) {
      opts.dir = path.resolve(opts.dir)
    }

    if (!opts.index) {
      opts.index = `file://${path.join(app.getAppPath(), 'index.html')}`
    }

    if (!opts.icon) {
      opts.icon = path.join(app.getAppPath(), 'icon.png')
    }

    this.opts = opts
    this.ready = false
    this.cachedBounds = null
    this.window = null
    this.positioner = null

    if (app.isReady()) {
      this._appReady()
    } else {
      app.on('ready', this._appReady.bind(this))
    }
  }

  /**
   * This sets up the tray. Must only be called once.
   */
  _appReady () {
    if (app.dock && !this.opts.showDockIcon) {
      app.dock.hide()
    }

    let clickEvent = this.opts.showOnRightClick ? 'right-click' : 'click'

    this.tray = new Tray(this.opts.icon)
    this.tray.on(clickEvent, this._clicked.bind(this))
    this.tray.on('double-click', this._clicked.bind(this))
    this.tray.setToolTip(this.opts.tooltip)
    this.tray.setHighlightMode('never')

    if (this.opts.preloadWindow) {
      this._createWindow()
    }

    this.ready = true
    this.emit('ready')
  }

  /**
   * Creates the Window. Must only be called once.
   */
  _createWindow () {
    this.emit('create-window')

    this.window = new BrowserWindow(this.opts.window)
    this.positioner = new Positioner(this.window)

    if (this.opts.showOnAllWorkspaces !== false) {
      this.window.setVisibleOnAllWorkspaces(true)
    }

    this.window.on('close', () => {
      this.window = null
    })

    this.window.on('blur', () => {
      if (!this.window.isAlwaysOnTop()) this.hide()
    })

    this.window.loadURL(this.opts.index)
    this.emit('after-create-window')
  }

  /**
   * Triggered when clicking the tray icon.
   *
   * @param {Event} event
   * @param {Rectangle} bounds
   */
  _clicked (event, bounds) {
    // Hide the window if clicking with ALT/SHIFT/CTRL or Meta keys.
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
      return this.hide()
    }

    // If there is a window and it is already visible, hide it.
    if (this.window && this.window.isVisible()) {
      return this.hide()
    }

    this.cachedBounds = bounds || this.cachedBounds
    this.show()
  }

  /**
   * Informs if the Menubar is already ready.
   */
  isReady () {
    return this.ready
  }

  /**
   * Hides the Window.
   */
  hide () {
    this.tray.setHighlightMode('never')
    if (!this.window) return
    this.emit('hide')
    this.window.hide()
  }

  /**
   * Shows the Window.
   */
  show () {
    this.tray.setHighlightMode('always')
    if (!this.window) {
      this._createWindow()
    }

    if (!this.cachedBounds) {
      this.cachedBounds = this.tray.getBounds()
    }

    if (process.platform !== 'win32' && process.platform !== 'darwin') {
      return this._setPositionAndShow(this._positionByCursor())
    }

    if (!this.cachedBounds) {
      this.cachedBounds = this.tray.getBounds()
    }

    let position = this.positioner.calculate(this.opts.windowPosition, this.cachedBounds)
    this._setPositionAndShow(position)
  }

  _setPositionAndShow (pos) {
    pos.x = (this.opts.window.x !== undefined) ? this.opts.window.x : pos.x
    pos.y = (this.opts.window.y !== undefined) ? this.opts.window.y : pos.y

    this.window.setPosition(pos.x, pos.y)
    this.window.show()
    this.emit('show')
  }

  /**
   * Get the Position by Cursor.
   *
   * @return {Point}
   */
  _positionByCursor () {
    const screen = electron.screen
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
    const cursor = screen.getCursorScreenPoint()
    const window = this.window.getBounds()

    let x = cursor.x
    let y = cursor.y

    if (x + window.width > display.bounds.width) {
      x -= window.width
    }

    if (y + window.height > display.bounds.height) {
      y -= window.height
    }

    return { x, y }
  }
}

module.exports = Menubar
