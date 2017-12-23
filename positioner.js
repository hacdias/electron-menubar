const electron = require('electron')

/**
 * Get the display nearest the current cursor position
 *
 * @return {Display} - the display closest to the current cursor position
 */
function getDisplay () {
  const screen = electron.screen
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

/**
 * Get cursor position
 *
 * @return {Point} - the position of the cursor
 */
function getCursorPosition () {
  return electron.screen.getCursorScreenPoint()
}

/**
 * Calculates the x position of the tray window
 *
 * @param {Rectangle} windowBounds - electron BrowserWindow bounds of tray window to position
 * @param {Rectangle} trayBounds - tray bounds from electron Tray.getBounds()
 * @param {string} [align] - align left|center|right, default: center
 *
 * @return {integer} - calculated x position
 */
function calculateXAlign (windowBounds, trayBounds, align) {
  const display = getDisplay()
  let x

  switch (align) {
    case 'right':
      x = trayBounds.x
      break
    case 'left':
      x = trayBounds.x + trayBounds.width - windowBounds.width
      break
    case 'center':
    default:
      x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
  }

  if (x + windowBounds.width > display.bounds.width && align !== 'left') {
    // if window would overlap on right side align it to the end of the screen
    x = display.bounds.width - windowBounds.width
  } else if (x < 0 && align !== 'right') {
    // if window would overlap on the left side align it to the beginning
    x = 0
  }

  return x
}

/**
 * Calculates the y position of the tray window
 *
 * @param {Rectangle} windowBounds - electron BrowserWindow bounds
 * @param {Rectangle} trayBounds - tray bounds from electron Tray.getBounds()
 * @param {string} [align] - align up|middle|down, default: down
 *
 * @return {integer} - calculated y position
 */
function calculateYAlign (windowBounds, trayBounds, align) {
  const display = getDisplay()
  let y

  switch (align) {
    case 'up':
      y = trayBounds.y + trayBounds.height - windowBounds.height
      break
    case 'down':
      y = trayBounds.y
      break
    case 'center':
    default:
      y = Math.round((trayBounds.y + (trayBounds.height / 2)) - (windowBounds.height / 2))
      break
  }

  if (y + windowBounds.height > display.bounds.height && align !== 'up') {
    y = trayBounds.y + trayBounds.height - windowBounds.height
  } else if (y < 0 && align !== 'down') {
    y = 0
  }

  return y
}

/**
 * Calculates the position of the tray window based on current cursor position
 * This method is used on linux where trayBounds are not available
 *
 * @param {Rectangle} windowBounds - electron BrowserWindow bounds of tray window to position
 * @param {Eelectron.Display} display - display on which the cursor is currently
 * @param {Point} cursor - current cursor position
 *
 * @return {Point} - Calculated point {x, y} where the window should be positioned
 */
function calculateByCursorPosition (windowBounds, display, cursor) {
  let x = cursor.x
  let y = cursor.y

  if (x + windowBounds.width > display.bounds.width) {
    // if window would overlap on right side of screen, align it to the left of the cursor
    x -= windowBounds.width
  }

  if (y + windowBounds.height > display.bounds.height) {
    // if window would overlap at bottom of screen, align it up from cursor position
    y -= windowBounds.height
  }

  return {
    x: x,
    y: y
  }
}

class Positioner {
  /**
   * Calculates the position of the tray window
   *
   * @param {Rectangle} windowBounds - electron BrowserWindow bounds of tray window to position
   * @param {Rectangle} trayBounds - tray bounds from electron Tray
   * @param {Object} [alignment] - alignment of window to tray
   * @param {string} [alignment.x] - x align if tray bar is on top or bottom (left|center|right),
      default: center
   * @param {string} [alignment.y] - y align if tray bar is left or right (up|middle|down),
      default: down
   * @return {Point} - Calculated point {x, y} where the window should be positioned
   */
  static calculate (windowBounds, trayBounds, alignment) {
    if (process.platform === 'linux') {
      const cursor = getCursorPosition()
      return calculateByCursorPosition(windowBounds, getDisplay(), cursor)
    }

    const _alignment = alignment || {}
    const taskbarPosition = this.getTaskbarPosition()
    const display = getDisplay()
    let x
    let y

    switch (taskbarPosition) {
      case 'left':
        x = display.workArea.x
        y = calculateYAlign(windowBounds, trayBounds, _alignment.y)
        break
      case 'right':
        x = display.workArea.width - windowBounds.width
        y = calculateYAlign(windowBounds, trayBounds, _alignment.y)
        break
      case 'bottom':
        x = calculateXAlign(windowBounds, trayBounds, _alignment.x)
        y = display.workArea.height - windowBounds.height
        break
      case 'top':
      default:
        x = calculateXAlign(windowBounds, trayBounds, _alignment.x)
        y = display.workArea.y
    }

    return {
      x,
      y
    }
  }

  /**
   * Calculates the position of the tray window
   *
   * @param {BrowserWindow} window - window to position
   * @param {Rectangle} trayBounds - tray bounds from electron Tray
   * @param {Object} [alignment] - alignment of window to tray
   * @param {string} [alignment.x] - x align if tray bar is on top or bottom (left|center|right),
      default: center
   * @param {string} [alignment.y] - y align if tray bar is left or right (up|middle|down),
      default: down
   *
   * @return {Void}
   */
  static position (window, trayBounds, alignment) {
    const position = this.calculate(window.getBounds(), trayBounds, alignment)
    window.setPosition(position.x, position.y, false)
  }

  /**
   * Calculates the position of the tray window
   *
   * @return {string} - the position of the taskbar (top|right|bottom|left)
   */
  static getTaskbarPosition () {
    const display = getDisplay()

    if (display.workArea.y > 0) {
      return 'top'
    } else if (display.workArea.x > 0) {
      return 'left'
    } else if (display.workArea.width === display.bounds.width) {
      return 'bottom'
    }

    return 'right'
  }
}

module.exports = Positioner
