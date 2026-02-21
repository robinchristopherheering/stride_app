import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/stride_app/',
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
})
