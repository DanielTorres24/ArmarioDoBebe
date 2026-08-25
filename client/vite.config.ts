import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O build vai para server/public, para o Express servir tudo num só serviço.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: '../server/public', emptyOutDir: true },
});
