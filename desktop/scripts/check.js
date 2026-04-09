const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const desktopRoot = path.resolve(__dirname, "..");
const filesToCheck = [
  "main.js",
  "preload.js",
  "renderer.js"
];

for (const relativePath of filesToCheck) {
  const absolutePath = path.join(desktopRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing required desktop file: ${relativePath}`);
    process.exit(1);
  }

  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    cwd: desktopRoot,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Desktop target check passed.");
