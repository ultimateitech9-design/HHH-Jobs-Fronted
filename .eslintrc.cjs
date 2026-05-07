module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': 0,
    'react/prop-types': 0,
  },
  overrides: [
    {
      files: [
        'src/i18n/index.jsx',
        'src/routes/**/*Routes.jsx',
        'src/routes/index.jsx',
        'src/modules/super-admin/components/AdminSidebar.jsx',
        'src/modules/support/pages/FAQ.jsx'
      ],
      rules: {
        'react-refresh/only-export-components': 'off'
      }
    },
    {
      files: ['tests/**/*.{js,jsx}', 'test/**/*.{js,jsx}'],
      env: { node: true, es2020: true }
    }
  ]
}
