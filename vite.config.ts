import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/bibleamsong/',
  plugins: [react()],
  server: {
    proxy: {
      '/rv-api': {
        target: 'https://www.rv.or.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rv-api/, '')
      }
    }
  }
})
