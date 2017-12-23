Based on [menubar module](https://github.com/maxogden/menubar) with improvements.

TODO:

- [ ] Fix position on linux (calculate by cursor position)

## `new Menubar([options])`

- `options` Object (optional)
    - `icon` String. The tray's icon. Defaults to `app.getAppPath()/icon.png`.
    - `index` String. The index file for the window. Defaults to `app.getAppPath()/index.html`.
    - `windowPosition` String.
    - `showDockIcon` Boolean. Default is `false`.
    - `showOnRightClick` Boolean. Default is `false`.
    - `showOnAllWorkspaces` Boolean. Default is `false`.
    - `tooltip` String. The tray's tooltip.

TODO: DOCS