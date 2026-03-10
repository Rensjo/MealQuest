import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: { compact: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  publicDir: 'public',
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg', '**/*.png', '**/*.jpg', '**/*.svg', '**/*.webp'],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'recharts'],
          'state-vendor': ['zustand'],
          'utils-vendor': ['nanoid', 'date-fns', 'clsx'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    reportCompressedSize: true,
    cssCodeSplit: true,
  },
  server: {
    hmr: true,
    port: 5175,
    open: false,
    cors: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'framer-motion', 'lucide-react', 'recharts', 'nanoid', 'date-fns', 'clsx'],
    esbuildOptions: { target: 'esnext' },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  preview: { port: 4175, strictPort: true },
})
