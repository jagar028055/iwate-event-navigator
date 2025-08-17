import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Cloudflareの環境変数を複数の方法で取得
    const geminiApiKey = env.GEMINI_API_KEY || 
                         env.VITE_GEMINI_API_KEY || 
                         process.env.GEMINI_API_KEY || 
                         process.env.VITE_GEMINI_API_KEY;
    
    console.log('Build time - GEMINI_API_KEY:', geminiApiKey ? 'SET' : 'NOT SET');
    console.log('Environment variables available:', Object.keys(env).filter(key => key.includes('GEMINI')));
    console.log('Process env GEMINI keys:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    // デバッグ用: 実際の値の最初の数文字を表示
    if (geminiApiKey) {
        console.log('API Key preview:', geminiApiKey.substring(0, 10) + '...');
    }
    
    return {
      plugins: [react()],
      base: '/',
      define: {
        // より確実な方法で環境変数を定義
        '__GEMINI_API_KEY__': JSON.stringify(geminiApiKey),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey)
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
