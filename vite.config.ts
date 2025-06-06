import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  base: '/DefenseMagnate/', // Replace with your actual repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
