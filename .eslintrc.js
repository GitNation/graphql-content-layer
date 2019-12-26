const error = 2;
const warn = 1;
const ignore = 0;

module.exports = {
  root: true,
  extends: ['eslint-config-airbnb', 'plugin:jest/recommended', 'prettier'],
  plugins: ['prettier', 'jest', 'react', 'json'],
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
    quotes: [warn, 'single', { avoidEscape: true }],
    'arrow-parens': [warn, 'as-needed'],
    'import/no-unresolved': warn,
    'import/prefer-default-export': ignore,
    'import/no-extraneous-dependencies': ignore,
  },
};
