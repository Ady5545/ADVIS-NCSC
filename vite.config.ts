import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isVercelBuild = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL
)

export default defineConfig({
  // Vercel serves from the domain root; GitHub Pages uses the repository subpath.
  base: isVercelBuild ? '/' : '/ADVIS-NCSC/',
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
