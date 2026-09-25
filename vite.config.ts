import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // This repository is published at https://ady5545.github.io/ADVIS-NCSC/
  base: '/ADVIS-NCSC/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      ignored: ['**/.data/**']
    }
  }
})
