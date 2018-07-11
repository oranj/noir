const {app, BrowserWindow, Menu, shell} = require('electron')
const path = require('path');
const url = require('url');
const fs = require('fs');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

process.umask = 0;

global.DIR_APPDATA  = app.getPath('userData');
global.DIR_SETTINGS = DIR_APPDATA + "/Settings";
global.DIR_LOGS     = DIR_APPDATA + "/Logs";
global.FILE_PREFS   = DIR_SETTINGS + "/prefs.json";

if (! fs.existsSync(DIR_APPDATA)) {
  fs.mkdirSync(DIR_APPDATA, '0777');
}

if (! fs.existsSync(DIR_SETTINGS)) {
  fs.mkdirSync(DIR_SETTINGS, '0777');
}

if (! fs.existsSync(DIR_LOGS)) {
  fs.mkdirSync(DIR_LOGS, '0777');
}

if (! fs.existsSync(global.FILE_PREFS)) {
  let defaults = {
    "connections": [
      {
        "type": "noir-contrib-irc",
        "name": "Thing 1",
        "host": "irc.freenode.com",
        "userName": "Thing1",
        "channels": [
          "#noirchat"
        ]
      }
    ]
  };
  fs.writeFileSync(global.FILE_PREFS, JSON.stringify(defaults, null, "\t"), { mode: '0777' });
}

var contents = fs.readFileSync(global.FILE_PREFS);
global.SETTINGS = JSON.parse(contents);

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 500,
    minWidth: 600
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))


  var template = [
  {
    label: "Application",
    submenu: [
      { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
      { label: "Toggle Developer Tools", accelerator: "CommandOrControl+Alt+I", click: ()  =>  win.webContents.toggleDevTools() },
      { label: "Preferences", submenu: [
        {
          label: "Settings",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            shell.openItem( global.FILE_PREFS, {}, function() {
              throw new Error(JSON.stringify(Array.from(arguments)));
            });
          }
        }
      ]},
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// app.on('before-quit', () => {
//   fs.writeFileSync(PREF_FILE, JSON.stringify(SETTINGS));
// })

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
