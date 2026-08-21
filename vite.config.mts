import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  const target = `http://${env.VITE_PROXY_HOST || 'localhost:8000'}`
  const changeOriginTarget = {
    changeOrigin: true,
    headers: { Origin: target },
    target
  }

  return {
    build: {
      chunkSizeWarningLimit: 1600,
      target: 'es2019'
    },
    plugins: [Vue()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src')
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/admin': changeOriginTarget,
        '/api': changeOriginTarget,
        '/asyncapi': changeOriginTarget,
        '/complete': changeOriginTarget,
        '/login': changeOriginTarget,
        '/media': target,
        '/static': target,
        '/ws': {
          ...changeOriginTarget,
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
