module.exports = {
  root: true,

  env: {
    es2021: true
  },

  parserOptions: {
    parser: '@typescript-eslint/parser'
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names':
      process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    indent: 'off'
  },

  extends: ['plugin:vue/vue3-essential', '@vue/prettier', '@vue/typescript']
}
