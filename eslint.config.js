import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**']
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.base,
  vueTsConfigs.eslintRecommended,
  skipFormatting,

  {
    name: 'app/rules',
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-component-names':
        process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      indent: 'off',
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'vue/return-in-computed-property': 'off',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
)
