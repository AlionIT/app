#!/usr/bin/env node

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const preferredPort = Number.parseInt(process.env.PORT || "5173", 10);
const maxPortAttempts = 20;

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, "http://localhost");
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const requestedPath = safePath ? path.join(rootDir, safePath) : path.join(rootDir, "index.html");
  const resolvedPath = path.resolve(requestedPath);

  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    return path.join(resolvedPath, "index.html");
  }

  return resolvedPath;
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || "/");

  if (!filePath || !fs.existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "content-type": contentTypes.get(extension) || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(response);
});

function listen(port, attemptsLeft = maxPortAttempts) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }

    throw error;
  });

  server.listen(port, () => {
    console.log(`AlionIT web is running at http://localhost:${port}`);
  });
}

listen(preferredPort);
