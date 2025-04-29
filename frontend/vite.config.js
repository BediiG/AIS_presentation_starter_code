import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Listen to all network interfaces inside container
    port: 5173,      // Keep standard Vite port
    strictPort: true, // Fail fast if port already taken
    watch: {
      usePolling: true, // For Docker volume watching
    }
  }
})
