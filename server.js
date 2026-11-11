const http = require("http");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function createGameServer() {
  return http.createServer((req, res) => {
    const safePath = decodeURIComponent(req.url.split("?")[0]);
    const relPath = safePath === "/" ? "index.html" : safePath.replace(/^\/+/, "");
    const filePath = path.join(ROOT, relPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(content);
    });
  });
}

function startServer(port) {
  const server = createGameServer();

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
    }
  });

  server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`  THE CURSED KINGDOM is running at:`);
    console.log(`  http://localhost:${port}`);
    console.log(`==================================================\n`);
  });
}

startServer(DEFAULT_PORT);
