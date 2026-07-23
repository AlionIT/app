#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { targets } from "./targets/index.mjs";

const ACTIONS = Object.freeze(["start", "dev", "check", "build"]);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [action, targetName, ...forwardedArgs] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  console.error("");
  console.error("Usage:");
  console.error("  npm run <start|dev|check|build> -- <target>");
  console.error("");
  console.error(`Available targets: ${Object.keys(targets).join(", ") || "(none)"}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? projectRoot,
      env: options.env ?? process.env,
      stdio: "inherit",
      shell: options.shell ?? false,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} was terminated by ${signal}`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}

function runNpm(npmArgs, options = {}) {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return run(process.execPath, [npmExecPath, ...npmArgs], options);
  }

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return run(command, npmArgs, { ...options, shell: process.platform === "win32" });
}

function runNpmScript(cwd, script, args = forwardedArgs) {
  const npmArgs = ["run", script];

  if (args.length > 0) {
    npmArgs.push("--", ...args);
  }

  return runNpm(npmArgs, { cwd });
}

if (!ACTIONS.includes(action)) {
  fail(`Unknown action "${action ?? ""}".`);
}

if (!targetName) {
  fail("Target is required.");
}

const target = targets[targetName];

if (!target) {
  fail(`Target "${targetName}" is not available in this project.`);
}

const execute = target[action];

if (typeof execute !== "function") {
  fail(`Action "${action}" is not implemented for target "${targetName}".`);
}

try {
  const code = await execute({
    action,
    forwardedArgs,
    projectRoot,
    run,
    runNpm,
    runNpmScript,
    targetName,
  });

  process.exitCode = Number.isInteger(code) ? code : 0;
} catch (error) {
  console.error(`[scripts] ${error.message}`);
  process.exitCode = 1;
}
