# electron-menubar

[![npm](https://img.shields.io/npm/v/electron-menubar.svg?style=flat-square)](https://www.npmjs.com/package/electron-menubar)
[![Travis](https://img.shields.io/travis/hacdias/electron-menubar.svg?style=flat-square)](https://travis-ci.org/hacdias/electron-menubar)

This lets you create a menubar very easily with Electron.

## Install

```
npm install --save electron-menubar
```

## Documentation

### Class `Menubar`

#### `new Menubar([options])`

- `options` Object (optional)
    - `icon` String. The tray's icon. Defaults to `app.getAppPath()/icon.png`.
    - `index` String. The index file for the window. Defaults to `app.getAppPath()/index.html`.
    - `preloadWindow` Boolean. Tells if the window must be preloaded. Defaults to `false`.
    - `showDockIcon` Boolean. Default is `false`.
    - `showOnRightClick` Boolean. Default is `false`.
    - `showOnAllWorkspaces` Boolean. Default is `false`.
    - `tooltip` String. The tray's tooltip.
    
#### Methods

- `menubar.isReady()` tells if the menubar is already ready.
- `menubar.hide()` hides the window.
- `menubar.show()` shows the window.

#### Events

- `ready`
- `create-window`
- `after-create-window`
- `hide`
- `after-hide`
- `show`
- `after-show`

### Class `Positioner`

- `Positioner.getTaskbarPosition()` returns the position of the taskbar: `top|right|bottom|left`.
- `Positioner.position(window, trayBounds, [alignment])` positions the window in a certain place.
    - `window` BrowserWindow. Is the window to position.
    - `trayBounds` Rectangle. Are the bounds from the Electron.Tray.
    - `alignment` Object. Are the positions to position the window.
        - `alignment.x` String. Defaults to `center`. Can be `left|center|right`.
        - `alignment.y` String. Defaults to `center`. Can be `up|center|down`.
- `Positioner.calculate(windowBounds, trayBounds, [alignment])` only calculates the position and returns an Object `{x: n, y: k}`.
    - `windowBounds` Rectangle. A BrowserWindow bounds.
    - `trayBounds` Rectangle. Are the bounds from the Electron.Tray.
    - `alignment` Object. Are the positions to position the window.
        - `alignment.x` String. Defaults to `center`. Can be `left|center|right`.
        - `alignment.y` String. Defaults to `center`. Can be `up|center|down`.

## Credits

The code of this project is mainly based on [`menubar`](https://github.com/maxogden/menubar) and [`electron-traywindow-positioner`](https://github.com/pixtron/electron-traywindow-positioner) with some improvements and cleaning.
