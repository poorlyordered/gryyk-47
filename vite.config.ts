import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    force: true,
  },
  server: {
    port: 5173, // Use port 5173 to match the registered callback URL
  },
  build: {
    rollupOptions: {
      external: [
        'mongodb',
        'mongodb-client-encryption',
        '@mongodb-js/saslprep',
        '@mongodb-js/zstd',
        'kerberos',
        'snappy',
        'socks',
        'gcp-metadata',
        '@aws-sdk/credential-providers',
        'mongodb-connection-string-url',
        'bson',
        'node-fetch',
        'fs',
        'path',
        'crypto',
        'stream',
        'net',
        'dns',
        'util',
        'zlib',
        'http',
        'https',
        'timers',
        'url',
        'tls',
        'fs/promises',
        'stream/web',
        'os',
        'async_hooks',
        '_http_common',
        'dotenv'
      ]
    }
  },
  define: {
    // Avoid Node.js polyfills for client-side code
    global: 'globalThis',
  }
});
