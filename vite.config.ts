import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    force: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
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
          // React core and ALL React-based UI libraries - must be in one chunk
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@chakra-ui') ||
              id.includes('node_modules/@emotion') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/react-icons') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/zustand')) {
            return 'react-ui';
          }
          // AI SDK and related
          if (id.includes('node_modules/ai') || id.includes('node_modules/@ai-sdk')) {
            return 'ai-sdk';
          }
          // Chart libraries
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // JWT and auth libraries (don't depend on React)
          if (id.includes('node_modules/jose') || id.includes('node_modules/jwt-decode') || id.includes('node_modules/zod')) {
            return 'auth-utils';
          }
          // Mastra core (don't depend on React)
          if (id.includes('node_modules/@mastra')) {
            return 'mastra';
          }
          // Other vendor libraries (should be minimal now)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 700, // Increase warning limit for the large react-ui chunk
  },
  define: {
    // Avoid Node.js polyfills for client-side code
    global: 'globalThis',
  }
});
