import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log('Loaded environment variables:', env) // Debug log to check loaded environment variables

  return {
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
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://${env.VITE_PROXY_HOST || 'localhost:8000'}`,
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: `ws://${env.VITE_PROXY_HOST || 'localhost:8000'}`,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
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
  }
})
