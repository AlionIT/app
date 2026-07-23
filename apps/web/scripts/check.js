#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const webRoot = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  path.join("src", "main.js"),
  path.join("src", "styles.css"),
  path.join("scripts", "serve.js"),
  path.join("scripts", "build.js")
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(webRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing required web file: ${relativePath}`);
    process.exit(1);
  }
}

for (const relativePath of ["src/main.js", "scripts/serve.js", "scripts/build.js"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(webRoot, relativePath)], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const html = fs.readFileSync(path.join(webRoot, "index.html"), "utf8");

if (!html.includes("AlionIT")) {
  console.error("index.html must contain the AlionIT brand.");
  process.exit(1);
}

if (!html.includes("./src/styles.css") || !html.includes("./src/main.js")) {
  console.error("index.html must load the local stylesheet and script.");
  process.exit(1);
}

console.log("Web target check passed.");
