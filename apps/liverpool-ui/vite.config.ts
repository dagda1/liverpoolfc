import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const localPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../setuptests.ts');
const ciPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../setuptests.ts');

const setupTestsPath = fs.existsSync(localPath) ? localPath : ciPath;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const alias = {
  ...((isDev || isTest) && {
    '@liverpool/etl': path.resolve(__dirname, '../../packages/etl/src'),
  }),
};

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  plugins: [
    checker({ typescript: { tsconfigPath: 'tsconfig.dist.json' } }),
    dts({ tsconfigPath: isTest ? 'tsconfig.json' : 'tsconfig.dist.json', logLevel: 'error' }),
    nodePolyfills({
      globals: {
        Buffer: false,
        global: false,
        process: false,
      },
    }),
    tsconfigPaths(),
    react(),
  ],
  server: {
    fs: {
      allow: isDev ? [path.resolve(__dirname), path.resolve(__dirname, '../../packages/etl')] : undefined,
    },
    hmr: {
      port: 5174,
    },
  },
  logLevel: 'warn',
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/icons-material',
      '@mui/styled-engine',
    ],
    alias,
  },
  optimizeDeps: {
    include: ['react/jsx-runtime', 'react', 'react-dom'],
    exclude: isDev ? ['@liverpool/*'] : [],
  },
  build: {
    sourcemap: isDev ? 'inline' : true,
    minify: isProd,
    rollupOptions: {
      external: [/^@types\/.*/],
      output: {
        format: 'esm',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    setupFiles: setupTestsPath,
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
});
