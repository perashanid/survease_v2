const fs = require('fs');
const path = require('path');

// After build, ensure all necessary files are in place
const distDir = path.join(__dirname, 'dist');

// Copy _redirects if it doesn't exist
const redirectsSource = path.join(__dirname, 'public', '_redirects');
const redirectsTarget = path.join(distDir, '_redirects');

if (fs.existsSync(redirectsSource) && !fs.existsSync(redirectsTarget)) {
  fs.copyFileSync(redirectsSource, redirectsTarget);
  console.log('✅ Copied _redirects to dist');
}

// Ensure 404.html exists
const notFoundSource = path.join(__dirname, 'public', '404.html');
const notFoundTarget = path.join(distDir, '404.html');

if (fs.existsSync(notFoundSource) && !fs.existsSync(notFoundTarget)) {
  fs.copyFileSync(notFoundSource, notFoundTarget);
  console.log('✅ Copied 404.html to dist');
}

console.log('✅ Build post-processing complete');