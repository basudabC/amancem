import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [
    inspectAttr(),
    react(),
    {
      name: 'env-logger',
      config() {
        console.log('🏗️  Build Env Check:', {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing',
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
});
