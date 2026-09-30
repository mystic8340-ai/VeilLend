import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      'isomorphic-ws': path.resolve(__dirname, 'src/midnight/isomorphic-ws-fix.mjs'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'esnext'
  },
  server: {
    port: 3000
  }
});


