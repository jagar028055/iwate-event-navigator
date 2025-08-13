import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/iwate-event-navigator/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              maps: ['leaflet', 'react-leaflet'],
              ai: ['@google/genai'],
              utils: ['zustand', 'clsx']
            }
          }
        },
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
