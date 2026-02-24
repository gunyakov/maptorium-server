import { app, BrowserWindow, Tray, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { initialize, enable } from "@electron/remote/main/index.js"; // explicit file import to avoid ESM directory import errors

initialize();

// IPC handlers for window controls (renderer calls via preload)
ipcMain.on("app:minimize", () => {
  const w = BrowserWindow.getFocusedWindow();
  if (w) w.minimize();
});
ipcMain.on("app:toggle-maximize", () => {
  const w = BrowserWindow.getFocusedWindow();
  if (!w) return;
  if (w.isMaximized()) w.unmaximize();
  else w.maximize();
});
// keep server instance reference so we can close it on quit
let _serverInstance: any = null;

ipcMain.on("app:close", async () => {
  try {
    if (_serverInstance && typeof _serverInstance.close === "function") {
      await _serverInstance.close();
    } else {
      console.log("No server instance to close");
    }
  } catch (e) {
    console.error("Error while closing server on app:close", e);
  }
  app.quit();
});

function getAssetPath(...parts) {
  if (app.isPackaged) {
    // resources are copied to process.resourcesPath
    return path.join(process.resourcesPath, ...parts);
  }
  return path.join(__dirname, ...parts);
}

const iconPath = getAssetPath(
  "icons",
  process.platform === "win32" ? "icon.ico" : "icon.png",
);

function ensureUserConfig() {
  const userPath = path.join(app.getPath("userData"), "config.user.json");
  if (!fs.existsSync(userPath)) {
    // packaged default is at resources path
    const defaultPath = app.isPackaged
      ? path.join(process.resourcesPath, "config.user.json")
      : path.join(process.cwd(), "config.user.json");
    try {
      fs.mkdirSync(path.dirname(userPath), { recursive: true });
      fs.copyFileSync(defaultPath, userPath);
    } catch (e) {
      console.error("Failed to copy default config", e);
    }
  }
  process.env.MAP_CONFIG = userPath; // point your app to the user config (optional)
}

async function createWindowAndStartServer() {
  ensureUserConfig();
  // determine exec folder where public_html will be served from
  // in development use CWD; when packaged try a few common locations and pick
  // the one that actually contains `public_html` (resources/public_html or resources/app/public_html)
  let execFolder: string;
  if ((app as any).isPackaged) {
    const resourcesPath = process.resourcesPath;
    const candidates = [
      path.join(resourcesPath, "public_html"),
      path.join(resourcesPath, "app", "public_html"),
      path.join(app.getAppPath(), "public_html"),
      path.join(app.getAppPath(), "..", "public_html"),
    ];
    const found = candidates.find((p) => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    });
    if (found) {
      execFolder = path.dirname(found);
    } else {
      // fallback: use app.getAppPath() — may point inside asar
      execFolder = app.getAppPath();
    }
  } else {
    execFolder = process.cwd();
  }

  // require the compiled server; it should export start(opts)
  const serverModule = require(path.join(__dirname, "server"));
  if (!serverModule || typeof serverModule.start !== "function") {
    console.error("server.start() not found in server.js");
    app.quit();
    return;
  }

  // start the server and wait until it's listening
  const opts = {
    host: "127.0.0.1",
    // allow overriding port via env for debugging
    port: process.env.PORT ? Number(process.env.PORT) : 9009,
    execFolder,
  };

  let srv;
  try {
    if (_serverInstance) {
      // server already running (reuse)
      srv = _serverInstance;
    } else {
      srv = await serverModule.start(opts);
      // store global reference so IPC and quit handlers can close it
      _serverInstance = srv;
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    app.quit();
    return;
  }

  const url = `http://${srv.host}:${srv.port}`;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.resolve(__dirname, "preload.js"),
    },
  });

  enable(win.webContents);

  win.loadURL(url).catch((e) => console.error("Failed to load URL", e));
  //win.webContents.openDevTools();

  const tray = new Tray(iconPath);

  // when app is quitting, close server gracefully
  app.on("before-quit", async (event) => {
    if (srv && typeof srv.close === "function") {
      // prevent default quit until server closed
      event.preventDefault();
      try {
        await srv.close();
      } catch (e) {
        console.error("Error while closing server", e);
      }
      // now quit for real
      app.quit();
    }
  });
}

app.on("ready", () => {
  createWindowAndStartServer();
});

// Quit when all windows are closed (typical Windows behavior keeps app running only when needed)
app.on("window-all-closed", () => {
  // on macOS apps commonly stay open; for simplicity quit on all platforms
  app.quit();
});

// In case of second instance, focus existing window (optional)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // TODO: focus main window if you keep a reference
  });
}
