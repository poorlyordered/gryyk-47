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
      ],
      output: {
        manualChunks: (id) => {
          // Chakra UI - large UI library
          if (id.includes('node_modules/@chakra-ui')) {
            return 'chakra-ui';
          }
          // React and related core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // AI SDK and related
          if (id.includes('node_modules/ai') || id.includes('node_modules/@ai-sdk')) {
            return 'ai-sdk';
          }
          // Zustand state management
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          // Chart libraries
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase warning limit slightly for large chunks
  },
  define: {
    // Avoid Node.js polyfills for client-side code
    global: 'globalThis',
  }
});
