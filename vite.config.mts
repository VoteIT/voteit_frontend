import path from 'path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1600,
    target: 'es2019'
  },
  plugins: [Vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: { port: 8080 },
  test: {
    server: {
      deps: {
        inline: ['vuetify']
      }
    },
    environment: 'happy-dom',
    globals: true,
    setupFiles: 'vitest.setup.ts'
  }
})
