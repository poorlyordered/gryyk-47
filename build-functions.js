import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively copy directory contents
 */
function copyDirectoryRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all items in the source directory
  const items = fs.readdirSync(src, { withFileTypes: true });

  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);

    if (item.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectoryRecursive(srcPath, destPath);
    } else if (item.isFile() && item.name.endsWith('.ts')) {
      // Copy TypeScript files
      console.log(`Copying ${path.relative(__dirname, srcPath)}...`);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied to ${path.relative(__dirname, destPath)}`);
    }
  }
}

// Create the functions-dist directory if it doesn't exist
const functionsDistDir = path.join(__dirname, 'netlify', 'functions-dist');
if (!fs.existsSync(functionsDistDir)) {
  fs.mkdirSync(functionsDistDir, { recursive: true });
}

// Copy all TypeScript files and subdirectories from functions to functions-dist
const functionsDir = path.join(__dirname, 'netlify', 'functions');
console.log('📦 Copying Netlify functions...\n');
copyDirectoryRecursive(functionsDir, functionsDistDir);

console.log('\n✅ All functions copied successfully!');