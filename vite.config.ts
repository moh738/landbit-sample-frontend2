import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { htmlMetaPlugin } from './vite-plugin-html-meta';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlMetaPlugin()],
  resolve: {
    alias: {
      // Package ships dist/style.css but does not export it in package.json "exports"
      'react-range-slider-input/dist/style.css': path.resolve(
        __dirname,
        'node_modules/react-range-slider-input/dist/style.css',
      ),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['cigarless-evaluatingly-matilde.ngrok-free.dev'],
  },
  preview: {
    port: 3000,
  },
  build: {
    sourcemap: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // or "modern"
      },
    },
  },
});
