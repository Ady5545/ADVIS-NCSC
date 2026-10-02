import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // This repository is published at https://ady5545.github.io/ADVIS-NCSC/
  base: '/ADVIS-NCSC/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // OCCT ships WebAssembly; keep it out of Vite's dependency pre-bundling.
    exclude: ['occt-wasm'],
  },
  build: {
    // Required by the current OCCT WASM build (SIMD / tail-call / exception support).
    target: 'esnext',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      ignored: ['**/.data/**']
    }
  }
})
