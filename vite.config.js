import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Serve WASM files with the correct MIME type so browsers compile them
    {
      name: 'wasm-content-type',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          if (_req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cv': path.resolve(__dirname, './src/cv'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@state': path.resolve(__dirname, './src/state'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  optimizeDeps: {
    // Exclude MediaPipe from esbuild pre-bundling.
    // face_mesh.js uses runtime typeof-window checks and dynamic script loading
    // that esbuild transforms incorrectly, breaking WASM initialisation.
    exclude: ['@mediapipe/face_mesh'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
});
