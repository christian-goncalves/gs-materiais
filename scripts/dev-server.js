"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const handler = require("../api/submissions.js");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" };

function serveStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch (_) { res.statusCode = 400; res.end("Bad Request"); return; }
  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = path.resolve(root, "." + requested);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypes[path.extname(file)] || "application/octet-stream");
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (new URL(req.url, "http://localhost").pathname === "/api/submissions") return handler(req, res);
  return serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => console.log("dev-server:listening:" + port));
