#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.resolve(__dirname, "..");
const appRoot = path.resolve(webRoot, "..", "..");
const outputRoot = path.join(appRoot, "dist", "web");
const entries = ["index.html", "src", "assets"];

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

for (const entry of entries) {
  const sourcePath = path.join(webRoot, entry);
  const targetPath = path.join(outputRoot, entry);

  if (!fs.existsSync(sourcePath)) {
    continue;
  }

  fs.cpSync(sourcePath, targetPath, { recursive: true });
}

console.log(`Web build copied static files to ${path.relative(appRoot, outputRoot)}.`);
