#!/usr/bin/env node

const path = require("node:path");
const { spawn } = require("node:child_process");
const chokidar = require("chokidar");

const repoRoot = path.resolve(__dirname, "..");
const desktopRoot = path.join(repoRoot, "desktop");
const electronBinary = require("electron");
const reloadMessageType = "alionit:reload-renderer";
const debounceMs = 250;

let electronProcess = null;
let pendingRestart = false;
let isShuttingDown = false;
let pendingMode = null;
let pendingFiles = new Set();
let debounceTimer = null;

function normalizeRelativePath(filePath) {
  return path.relative(desktopRoot, filePath).split(path.sep).join("/").toLowerCase();
}

function isIgnoredPath(filePath) {
  const relativePath = normalizeRelativePath(filePath);

  if (!relativePath || relativePath.startsWith("..")) {
    return false;
  }

  return relativePath.startsWith("dist/") || relativePath.startsWith("node_modules/");
}

function classifyChange(filePath) {
  const relativePath = normalizeRelativePath(filePath);

  if (!relativePath || relativePath.startsWith("..")) {
    return null;
  }

  if (
    relativePath === "main.js" ||
    relativePath === "preload.js" ||
    relativePath === "package.json" ||
    relativePath.endsWith(".ico")
  ) {
    return "hard";
  }

  if (
    relativePath === "index.html" ||
    relativePath === "renderer.js" ||
    relativePath.startsWith("css/") ||
    relativePath.startsWith("img/") ||
    relativePath.startsWith("assets/")
  ) {
    return "soft";
  }

  return null;
}

function formatFiles(files) {
  return Array.from(files).sort().join(", ");
}

function startElectron() {
  electronProcess = spawn(electronBinary, ["."], {
    cwd: desktopRoot,
    env: {
      ...process.env,
      ALIONIT_DESKTOP_DEV_RELOAD: "1"
    },
    stdio: ["inherit", "inherit", "inherit", "ipc"]
  });

  console.log(`[dev-reload] Electron started (pid ${electronProcess.pid}).`);

  electronProcess.on("error", (error) => {
    console.error(`[dev-reload] Failed to start Electron: ${error.message}`);
    process.exit(1);
  });

  electronProcess.on("exit", (code, signal) => {
    const shouldRestart = pendingRestart;
    electronProcess = null;
    pendingRestart = false;

    if (isShuttingDown) {
      process.exit(code ?? 0);
    }

    if (shouldRestart) {
      console.log("[dev-reload] Electron restarted.");
      startElectron();
      return;
    }

    if (signal) {
      console.log(`[dev-reload] Electron exited with signal ${signal}.`);
    } else {
      console.log(`[dev-reload] Electron exited with code ${code ?? 0}.`);
    }

    process.exit(code ?? 0);
  });
}

function restartElectron(reason) {
  console.log(`[dev-reload] Hard restart: ${reason}`);

  if (!electronProcess) {
    startElectron();
    return;
  }

  pendingRestart = true;
  electronProcess.kill();
}

function reloadRenderer(reason) {
  if (!electronProcess || !electronProcess.connected) {
    console.log(`[dev-reload] Soft reload skipped: Electron IPC is not ready (${reason}).`);
    return;
  }

  console.log(`[dev-reload] Soft reload: ${reason}`);
  electronProcess.send({ type: reloadMessageType });
}

function flushPendingChange() {
  debounceTimer = null;

  if (!pendingMode) {
    return;
  }

  const mode = pendingMode;
  const files = pendingFiles;
  const description = formatFiles(files);

  pendingMode = null;
  pendingFiles = new Set();

  if (mode === "hard") {
    restartElectron(description);
    return;
  }

  reloadRenderer(description);
}

function scheduleChange(mode, filePath) {
  if (mode !== "soft" && mode !== "hard") {
    return;
  }

  if (pendingMode !== "hard") {
    pendingMode = mode;
  }

  pendingFiles.add(normalizeRelativePath(filePath));

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushPendingChange, debounceMs);
}

function shutdown(exitCode = 0) {
  isShuttingDown = true;
  clearTimeout(debounceTimer);
  watcher.close().catch(() => {});

  if (electronProcess) {
    electronProcess.kill();
    return;
  }

  process.exit(exitCode);
}

const watcher = chokidar.watch(desktopRoot, {
  ignored: isIgnoredPath,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 150,
    pollInterval: 50
  }
});

watcher.on("all", (eventName, filePath) => {
  const mode = classifyChange(filePath);

  if (!mode) {
    return;
  }

  console.log(`[dev-reload] ${eventName} -> ${normalizeRelativePath(filePath)} (${mode})`);
  scheduleChange(mode, filePath);
});

watcher.on("error", (error) => {
  console.error(`[dev-reload] Watcher error: ${error.message}`);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startElectron();
