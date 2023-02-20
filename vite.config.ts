import path from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: { port: 8080 },
  test: {
    deps: {
      inline: ['vuetify']
    },
    environment: 'happy-dom',
    globals: true,
    setupFiles: 'vuetify.config.ts'
  }
})
