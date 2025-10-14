
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content.js'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },

  // Add esbuild options to handle potential syntax issues
  esbuild: {
    // Allow JSX in .js files for content scripts
    loader: 'jsx',
    include: /\.(js|jsx)$/,
  }
});
