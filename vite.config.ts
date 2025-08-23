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
        // ブラウザ環境でのprocess.envアクセスを安全に処理
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        // Node.js環境変数の存在チェックを安全に処理
        'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
        // Define global for browser environment
        'global': 'globalThis',
        // Window object API key for browser access
        'window.__GEMINI_API_KEY__': JSON.stringify(geminiApiKey),
        // CI flag for testing
        'window.__CI__': JSON.stringify(process.env.CI || 'false')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2015',
        sourcemap: true,
        minify: 'esbuild',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            format: 'es',
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'maps': ['leaflet', 'react-leaflet'],
              'gemini': ['./services/geminiApiClient']
            }
          }
        }
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'leaflet',
          'react-leaflet', 
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
      },
      preview: {
        port: 4173,
        host: true
      }
    };
});
