const path = require('path')
const Positioner = require('electron-positioner')
const merge = require('lodash.merge')
const {EventEmitter} = require('events')
const {app, Tray, BrowserWindow} = require('electron')

const defaults = {
  windowPosition: (process.platform === 'win32') ? 'trayBottomCenter' : 'trayCenter',
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

module.exports = class Menubar extends EventEmitter {
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

    if (app.isReady()) {
      this._appReady()
    } else {
      app.on('ready', this._appReady.bind(this))
    }
  }

  _appReady () {
    if (app.dock && !this.opts.showDockIcon) {
      app.dock.hide()
    }

    let defaultClickEvent = this.opts.showOnRightClick ? 'right-click' : 'click'

    this.tray = new Tray(this.opts.icon)
    this.tray.on(defaultClickEvent, this._clicked.bind(this))
    this.tray.on('double-click', this._clicked.bind(this))
    this.tray.setToolTip(this.opts.tooltip)
    this.tray.setHighlightMode('never')

    if (this.opts.preloadWindow) {
      this._createWindow()
    }

    this.emit('ready')
  }

  _clicked (event, bounds) {
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
      return this.hide()
    }

    if (this.window && this.window.isVisible()) {
      return this.hide()
    }

    this.cachedBounds = bounds || this.cachedBounds
    this.show()
  }

  _createWindow () {
    this.emit('create-window')

    this.window = new BrowserWindow(this.opts.window)
    this.positioner = new Positioner(this.window)

    if (this.opts.showOnAllWorkspaces !== false) {
      this.window.setVisibleOnAllWorkspaces(true)
    }

    this.window.on('close', () => {
      delete this.window
      this.emit('after-close')
    })

    this.window.loadURL(this.opts.index)
    this.emit('after-create-window')
  }

  setOption (opt, val) {
    this.opts[opt] = val
  }

  getOption (opt) {
    return this.opts[opt]
  }

  hide () {
    this.tray.setHighlightMode('never')
    if (!this.window) return
    this.emit('hide')
    this.window.hide()
    this.emit('after-hide')
  }

  show () {
    if (this.supportsTrayHighlightState) this.tray.setHighlightMode('always')
    if (!this.window) {
      this._createWindow()
    }

    this.emit('show')

    let trayPos

    if (this.cachedBounds) {
      // Cached value will be used if showWindow is called without bounds data
      trayPos = this.cachedBounds
    } else if (this.tray.getBounds) {
      // Get the current tray bounds
      trayPos = this.tray.getBounds()
    }

    // Default the window to the right if `trayPos` bounds are undefined or null.
    var noBoundsPosition = null
    if ((trayPos === undefined || trayPos.x === 0) && this.opts.windowPosition.substr(0, 4) === 'tray') {
      noBoundsPosition = (process.platform === 'win32') ? 'bottomRight' : 'topRight'
    }

    var position = this.positioner.calculate(noBoundsPosition || this.opts.windowPosition, trayPos)

    var x = (this.opts.x !== undefined) ? this.opts.x : position.x
    var y = (this.opts.y !== undefined) ? this.opts.y : position.y

    this.window.setPosition(x, y)
    this.window.show()
    this.emit('after-show')
  }
}
