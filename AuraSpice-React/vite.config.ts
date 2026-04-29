import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Agent 19: Vite config with API proxy + path alias
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  base: '/',
})
