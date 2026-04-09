const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const APP_ROOT = __dirname;
const APP_ICON_PATH = path.join(APP_ROOT, "assets", "app.ico");
const APP_USER_MODEL_ID = "com.alionit.desktop";
const APP_TITLE = "AlionIT Desktop";
const isSmokeMode = process.env.ALIONIT_SMOKE === "1";
const isDevReloadEnabled =
  !app.isPackaged &&
  process.env.ALIONIT_DESKTOP_DEV_RELOAD === "1";

function reloadRendererWindow() {
  const window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

  if (!window || window.isDestroyed()) {
    return;
  }

  console.log("[dev-reload] Renderer reload requested.");
  window.webContents.reloadIgnoringCache();
}

function createMainWindow() {
  const hasAppIcon = fs.existsSync(APP_ICON_PATH);
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: APP_TITLE,
    autoHideMenuBar: true,
    backgroundColor: "#f3efe5",
    show: false,
    icon: hasAppIcon ? APP_ICON_PATH : undefined,
    webPreferences: {
      preload: path.join(APP_ROOT, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.platform === "win32") {
    if (hasAppIcon) {
      window.setIcon(APP_ICON_PATH);
    }

    if (typeof window.setAppDetails === "function") {
      const appDetails = {
        appId: APP_USER_MODEL_ID,
        relaunchDisplayName: APP_TITLE
      };

      if (hasAppIcon) {
        appDetails.appIconPath = APP_ICON_PATH;
      }

      window.setAppDetails(appDetails);
    }
  }

  window.once("ready-to-show", () => {
    window.show();

    if (isSmokeMode) {
      setTimeout(() => {
        app.quit();
      }, 1200);
    }
  });

  window.loadFile(path.join(APP_ROOT, "index.html"));
}

if (isDevReloadEnabled && typeof process.on === "function") {
  process.on("message", (message) => {
    if (message && message.type === "alionit:reload-renderer") {
      reloadRendererWindow();
    }
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_USER_MODEL_ID);
  }

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
