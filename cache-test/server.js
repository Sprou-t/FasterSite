const express = require('express');
const path = require('path');
const app = express();
const PORT = 4000;

// Serve static files with aggressive caching
app.use('/images', express.static('public/images', {
  maxAge: '1y', // 1 year
  immutable: true,
  etag: false, // Disable ETag to force cache behavior
  lastModified: false // Disable Last-Modified to force cache behavior
}));

// Simple HTML page to test the image
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cache Test</title>
    </head>
    <body>
      <h1>Cache Test</h1>
      <img src="/images/test-image.png" alt="Test Image" width="300">
      <br><br>
      <a href="/images/test-image.png" target="_blank">Direct Image Link</a>
      <br><br>
      <button onclick="window.location.reload()">Refresh Page</button>
      <button onclick="window.location.href='/'">Navigate Away and Back</button>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Cache test server running at http://localhost:${PORT}`);
  console.log(`Image URL: http://localhost:${PORT}/images/test-image.png`);
});