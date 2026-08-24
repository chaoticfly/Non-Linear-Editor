import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    // Wails' Windows asset proxy connects over IPv4. Pin Vite to the same
    // interface so `localhost` cannot resolve to ::1 for only one side.
    host: '127.0.0.1',
    strictPort: true,
  },
})
