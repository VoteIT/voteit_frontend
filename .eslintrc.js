module.exports = {
  root: true,

  env: {
    node: true
  },

  parserOptions: {
    parser: '@typescript-eslint/parser'
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'template-curly-spacing': 'off',
    indent: 'off'
  },

  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard',
    '@vue/typescript'
  ],

  overrides: [
    // Fix no-used-vars when importing ts types in .vue files
    {
      files: ['*.vue'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error'
      }
    }
  ]
}
