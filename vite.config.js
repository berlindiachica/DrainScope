import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        beranda: resolve(import.meta.dirname, 'index.html'),
        peta: resolve(import.meta.dirname, 'peta.html'),
        analisis: resolve(import.meta.dirname, 'analisis.html'),
      },
    },
  },
});
