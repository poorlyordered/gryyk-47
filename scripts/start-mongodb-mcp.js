/**
 * MongoDB MCP Server Starter
 *
 * This script starts the MongoDB MCP server using the configuration from mcp-config.json
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the MCP configuration
const configPath = path.join(__dirname, '..', 'mcp-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get the MongoDB MCP server configuration
const mongoConfig = config.mcpServers.MongoDB;
mongoConfig.args = mongoConfig.args.map((arg) =>
  arg === '${MONGODB_URI}' ? process.env.MONGODB_URI : arg
);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

console.log('Starting MongoDB MCP server...');

// Start the MongoDB MCP server
const mcpServer = spawn(mongoConfig.command, mongoConfig.args, {
  stdio: 'inherit',
  shell: true
});

// Handle server events
mcpServer.on('error', (err) => {
  console.error('Failed to start MongoDB MCP server:', err);
});

mcpServer.on('close', (code) => {
  if (code !== 0) {
    console.log(`MongoDB MCP server exited with code ${code}`);
  } else {
    console.log('MongoDB MCP server stopped');
  }
});

console.log('MongoDB MCP server started');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping MongoDB MCP server...');
  mcpServer.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Stopping MongoDB MCP server...');
  mcpServer.kill();
  process.exit();
});
