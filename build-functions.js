import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the functions-dist directory if it doesn't exist
const functionsDistDir = path.join(__dirname, 'netlify', 'functions-dist');
if (!fs.existsSync(functionsDistDir)) {
  fs.mkdirSync(functionsDistDir, { recursive: true });
}

// Get all TypeScript files in the functions directory
const functionsDir = path.join(__dirname, 'netlify', 'functions');
const functionFiles = fs.readdirSync(functionsDir)
  .filter(file => file.endsWith('.ts'));

// Copy each function file to the functions-dist directory
functionFiles.forEach(file => {
  const inputFile = path.join(functionsDir, file);
  const outputFile = path.join(functionsDistDir, file);
  
  try {
    console.log(`Copying ${file}...`);
    
    // Copy the file to the functions-dist directory
    fs.copyFileSync(inputFile, outputFile);
    console.log(`Successfully copied ${file} to ${outputFile}`);
  } catch (error) {
    console.error(`Error copying ${file}:`, error);
    process.exit(1);
  }
});

console.log('All functions copied successfully!');