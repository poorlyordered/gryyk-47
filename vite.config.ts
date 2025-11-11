import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
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
          // JWT and auth libraries (truly independent, no React dependency)
          if (id.includes('node_modules/jose') ||
              id.includes('node_modules/jwt-decode') ||
              id.includes('node_modules/zod')) {
            return 'auth-utils';
          }
          // AI SDK (has React hooks, needs React)
          if (id.includes('node_modules/ai') || id.includes('node_modules/@ai-sdk')) {
            return 'ai-sdk';
          }
          // Chart libraries (if used, likely need React)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Mastra core (independent)
          if (id.includes('node_modules/@mastra')) {
            return 'mastra';
          }
          // Everything else from node_modules goes into react-ui to ensure same React instance
          // This includes React, React-DOM, Chakra, Emotion, all UI libs, and any mystery deps
          if (id.includes('node_modules')) {
            return 'react-ui';
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
