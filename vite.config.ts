import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // CloudflareのGEMINI_API_KEYを使用（複数の方法で取得を試行）
    const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    console.log('Build time - GEMINI_API_KEY:', geminiApiKey ? 'SET' : 'NOT SET');
    console.log('Environment variables available:', Object.keys(env).filter(key => key.includes('GEMINI')));
    console.log('Process env GEMINI keys:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    return {
      plugins: [react()],
      base: '/',
      define: {
        // CloudflareのGEMINI_API_KEYをすべてのアクセス方法で利用可能にする
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'GEMINI_API_KEY_PLACEHOLDER': JSON.stringify(geminiApiKey)
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
