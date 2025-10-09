#!/usr/bin/env node

/**
 * HTTP server for test-site with COOP/COEP headers
 * These headers are required for SharedArrayBuffer support in modern browsers
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.mjs': 'application/javascript',
  '.onnx': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  // Parse URL and remove query string
  const urlPath = req.url.split('?')[0];

  // Default to index.html for root
  const filePath = urlPath === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, urlPath);

  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      // Set COOP/COEP headers for cross-origin isolation
      // This enables SharedArrayBuffer and other features
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
  console.log(`Serving files from: ${DIST_DIR}`);
  console.log('COOP/COEP headers enabled for SharedArrayBuffer support');
});
