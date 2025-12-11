import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: [], // 🚫 disable wasm

  // LAN hosting configuration
  server: {
    host: true, // bind to all interfaces (LAN)
    port: 5173,
    strictPort: true, // fail if port is taken
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
