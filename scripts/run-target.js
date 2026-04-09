#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const reservedTargets = new Set(["desktop", "web", "mobile", "server"]);
const commandsWithDesktopDefault = new Set([
  "start",
  "dev",
  "check",
  "pack",
  "dist",
  "prod:smoke"
]);

function parseArgs(argv) {
  const passthrough = [];
  let target = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--target") {
      target = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length) || null;
      continue;
    }

    if (!arg.startsWith("-") && !target) {
      target = arg;
      continue;
    }

    passthrough.push(arg);
  }

  return { target, passthrough };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exitWithMessage(message, code = 0) {
  console.log(message);
  process.exit(code);
}

function getNpmCommand(command, target, passthrough) {
  const args = ["run", command, "--workspace", target];

  if (passthrough.length > 0) {
    args.push("--", ...passthrough);
  }

  if (process.env.npm_execpath) {
    return {
      executable: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }

  return {
    executable: process.platform === "win32" ? "npm.cmd" : "npm",
    args
  };
}

const command = process.argv[2];

if (!command) {
  exitWithMessage("No root command was provided to the target router.", 1);
}

const { target: requestedTarget, passthrough } = parseArgs(process.argv.slice(3));
const target = requestedTarget || (commandsWithDesktopDefault.has(command) ? "desktop" : null);

if (!target) {
  exitWithMessage(`No target was provided for "${command}". Use a positional target or --target <name>.`, 1);
}

if (!reservedTargets.has(target)) {
  exitWithMessage(
    `Unknown target "${target}". Supported targets: ${Array.from(reservedTargets).join(", ")}.`,
    1
  );
}

const packageJsonPath = path.join(repoRoot, target, "package.json");

if (!fs.existsSync(packageJsonPath)) {
  exitWithMessage(
    `Target "${target}" is reserved in this monorepo, but it is not configured yet.`,
    0
  );
}

const targetPackageJson = readJson(packageJsonPath);
const targetScripts = targetPackageJson.scripts || {};

if (!targetScripts[command]) {
  exitWithMessage(
    `Target "${target}" exists, but it does not define the "${command}" script yet.`,
    1
  );
}

const npmCommand = getNpmCommand(command, target, passthrough);
const result = spawnSync(npmCommand.executable, npmCommand.args, {
  cwd: repoRoot,
  stdio: "inherit"
});

if (result.error) {
  exitWithMessage(
    `Failed to route "${command}" to target "${target}": ${result.error.message}`,
    1
  );
}

process.exit(result.status ?? 0);
