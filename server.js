const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const publicDir = path.join(__dirname, "public");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".mp4": "video/mp4"
  }[ext] || "application/octet-stream";
}

function startFallbackServer() {
  const server = http.createServer((req, res) => {
    const requestedPath = decodeURIComponent(req.url.split("?")[0]);
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(publicDir, safePath === "/" ? "index.html" : safePath);

    // Only serve files from public so asset requests cannot escape the project.
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": getContentType(filePath) });
      res.end(data);
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`Ronaldo penalty game running at http://localhost:${PORT}`);
    console.log("Express is not installed, so the built-in Node server is being used.");
  });
}

try {
  const express = require("express");
  const app = express();

  // Serve the static frontend and all media files from the public folder.
  app.use(express.static(publicDir));

  // Keep the root route explicit so visiting localhost:3000 opens the game.
  app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.listen(PORT, HOST, () => {
    console.log(`Ronaldo penalty game running at http://localhost:${PORT}`);
  });
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw error;
  }

  startFallbackServer();
}
