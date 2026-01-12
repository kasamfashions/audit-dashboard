import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: path.resolve(__dirname, 'embed.tsx'),
        name: 'AuditDashboard',
        fileName: 'audit-dashboard',
        formats: ['iife', 'es']
      },
      rollupOptions: {
        // No externalization so bundle is self-contained for easy embedding
        external: [],
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
