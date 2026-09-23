import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import type { AtRule, Declaration, Plugin } from 'postcss'

/**
 * Keep only the woff2 sources in @font-face rules, so older font formats never reach the build.
 * A rule that has no woff2 source is left alone.
 */
const woff2Only: Plugin = {
  postcssPlugin: 'woff2-only',
  AtRule: {
    'font-face'(rule: AtRule) {
      const isWoff2 = (source: string) =>
        /format\(\s*['"]?woff2['"]?\s*\)/.test(source)
      // Split on commas outside parentheses
      const sources = (value: string) =>
        value.split(/,(?![^(]*\))/).map((s) => s.trim())
      const decls: Declaration[] = []
      rule.walkDecls('src', (decl) => {
        decls.push(decl)
      })
      if (!decls.some((decl) => sources(decl.value).some(isWoff2))) return
      for (const decl of decls) {
        const woff2 = sources(decl.value).filter(isWoff2)
        if (woff2.length) decl.value = woff2.join(', ')
        else decl.remove()
      }
    }
  }
}

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
    css: {
      postcss: {
        plugins: [woff2Only]
      }
    },
    // Imports the Vuetify components and directives each template uses, so the rest stay out of the build
    plugins: [Vue(), Vuetify({ autoImport: true })],
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
