import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    open: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three'],
        },
      },
    },
  },
});
