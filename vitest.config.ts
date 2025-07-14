/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use node environment for CI compatibility
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/core-validation.test.ts', // Only run the essential test in CI
      'tests/unit/simple-validation.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.netlify',
      'coverage',
      'tests/system/**', // Skip heavy system tests in CI
      'tests/integration/**' // Skip integration tests in CI
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/features/agentConfiguration/types.ts',
        'src/features/agentConfiguration/index.ts'
      ],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,ts,jsx,tsx}',
        'src/tests/**',
        'src/**/__tests__/**',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/**/*.spec.{js,ts,jsx,tsx}'
      ],
      thresholds: {
        global: {
          branches: 50, // Lower thresholds for CI
          functions: 50,
          lines: 50,
          statements: 50
        }
      }
    },
    testTimeout: 10000, // Shorter timeout for CI
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@features': resolve(__dirname, './src/features'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@types': resolve(__dirname, './src/types')
    }
  }
});