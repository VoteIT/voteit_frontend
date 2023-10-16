module.exports = {
  root: true,

  env: {
    es2021: true
  },

  parserOptions: {
    parser: '@typescript-eslint/parser'
  },

  rules: {
    curly: 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'space-before-function-paren': 'off',
    'template-curly-spacing': 'off',
    'vue/multi-word-component-names':
      process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    indent: 'off'
  },

  extends: ['plugin:vue/vue3-essential', '@vue/standard', '@vue/typescript'],

  overrides: [
    // Fix no-unused-vars when importing ts types in .vue files
    {
      files: ['*.vue'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error'
      }
    }
  ]
}
