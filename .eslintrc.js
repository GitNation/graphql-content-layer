const error = 2;
const warn = 1;
const ignore = 0;

module.exports = {
  root: true,
  extends: [
    'eslint-config-airbnb',
    'plugin:jsx-a11y/recommended',
    'plugin:jest/recommended',
    'plugin:import/warnings',
    'plugin:json/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['jsx-a11y', 'jest', 'react', 'json'],
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    'jest/globals': true,
  },
  rules: {
    strict: [error, 'never'],
    'prettier/prettier': [
      warn,
      {
        bracketSpacing: true,
        trailingComma: 'all',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
      },
    ],
    // quotes: [warn, 'single', { avoidEscape: true }],
    'arrow-parens': [warn, 'as-needed'],
    'import/prefer-default-export': ignore,
    'react/prop-types': ignore,
    'react/jsx-filename-extension': ignore,
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
