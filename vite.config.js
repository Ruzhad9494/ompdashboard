import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ompdashboard/',   // <- exact nama repo kau
  build: {
    outDir: 'dist'
  }
})
