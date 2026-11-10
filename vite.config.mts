import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import Legacy from '@vitejs/plugin-legacy'
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
  const keepOriginTarget = {
    changeOrigin: false,
    target
  }
  return {
    build: {
      chunkSizeWarningLimit: 1600
    },
    css: {
      postcss: {
        plugins: [woff2Only]
      }
    },
    // Imports the Vuetify components and directives each template uses, so the rest stay out of the build
    plugins: [
      Vue(),
      Vuetify({ autoImport: true }),
      // Polyfills whatever newer JS APIs the build (dependencies included) uses, for the browsers we support.
      // These targets also set build.target. The CSS floor is Safari 14.1 (Vuetify's :is() and flex gap).
      Legacy({
        modernPolyfills: true,
        modernTargets: ['chrome >= 88', 'edge >= 88', 'firefox >= 78', 'safari >= 14.1', 'ios >= 14.5'],
        renderLegacyChunks: false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src')
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/admin/': changeOriginTarget,
        '/api/': changeOriginTarget,
        '/asyncapi/': changeOriginTarget,
        // Keep Host so redirect_uri and the pipeline's relative redirects come back through vite
        '/complete/': keepOriginTarget,
        '/login/': keepOriginTarget,
        '/media/': target,
        '/static/': target,
        '/ws/': {
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
