import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // CloudflareのGEMINI_API_KEYをVITE_GEMINI_API_KEYとして利用可能にする
    const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    
    return {
      plugins: [react()],
      base: '/',
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'GEMINI_API_KEY_PLACEHOLDER_WILL_BE_REPLACED': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        sourcemap: true,
        minify: 'esbuild',
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'leaflet',
          'react-leaflet', 
          '@google/genai',
          'zustand',
          'clsx'
        ]
      },
      esbuild: {
        supported: {
          'top-level-await': true
        }
      },
      server: {
        port: 5174,
        host: true,
        hmr: {
          overlay: false
        }
      }
    };
});
