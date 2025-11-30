module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error'],
    'no-console': 'error',
  },
  env: {
    es2017: true,
    node: true,
    mocha: true,
  },
  overrides: [
    {
      files: ['src/renderer/**/*.js', 'src/renderer/**/*.jsx'],
      plugins: ['import', 'react', 'react-hooks', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
      ],
      env: {
        node: true,
        browser: true,
        es6: true,
      },
      parser: '@babel/eslint-parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: {
          jsx: true,
        },
      },
      settings: {
        react: { version: 'detect' },
      },
      globals: {
        $: true,
      },
      rules: {
        camelcase: [
          'error',
          {
            properties: 'never',
            ignoreDestructuring: false,
            allow: ['^UNSAFE_'],
          },
        ],
        'no-use-before-define': 0,
        'react/jsx-closing-bracket-location': 0,
        'react/jsx-first-prop-new-line': 0,
        'react/jsx-uses-react': 2,
        'react/jsx-uses-vars': 2,
        'react/react-in-jsx-scope': 2,
        'react/forbid-prop-types': 0,
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'space-before-function-paren': 0,
        'func-names': 0,
        'class-methods-use-this': 0,
        'no-restricted-syntax': 0,
        'no-bitwise': 0,
        'prefer-destructuring': 0,
        'react/button-has-type': 0,
        'react/jsx-no-bind': 0,
        'react/destructuring-assignment': 0,
        'react/no-access-state-in-setstate': 0,
        'react/no-array-index-key': 0,
        'react/no-find-dom-node': 0,
        'react/no-string-refs': 0,
        'react/no-unused-prop-types': 0,
        'react/no-unused-state': 0,
        'react/prefer-stateless-function': 0,
        'react/prop-types': 0,
        'react/require-default-props': 0,
        'react/static-property-placement': ['error', 'static public field'],
        'jsx-a11y/anchor-is-valid': 0,
        'jsx-a11y/no-autofocus': 0,
        'jsx-a11y/click-events-have-key-events': 0,
        'jsx-a11y/label-has-associated-control': 0,
        'jsx-a11y/label-has-for': 0,
        'jsx-a11y/no-noninteractive-tabindex': 0,
        'jsx-a11y/no-static-element-interactions': 0,
      },
    },
    {
      files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
      env: { browser: true, es6: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      globals: { NodeJS: true, Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['import', 'react', 'react-hooks', 'prettier'],
      rules: {
        'react/prop-types': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off', // temporary disable for tests
      },
      settings: {
        react: { version: 'detect' },
      },
    },
    // NOTE: Using a temporary specific override for actions and reducers while the rest of
    // the renderer files are not converted to typescript, otherwise enabling
    // @typescript-eslint/explicit-module-boundary-types for all files would make
    // the linter go nuts
    {
      files: ['src/renderer/actions/*.ts', 'src/renderer/reducers/*.ts'],
      env: { browser: true, es6: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      globals: { NodeJS: true, Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['prettier', '@typescript-eslint'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
      settings: {
        react: { version: 'detect' },
      },
    },
    {
      files: ['src/*.ts', 'src/browser/**/*.ts', 'src/common/**/*.ts'],
      env: { browser: true, es6: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      globals: { NodeJS: true, Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['prettier', '@typescript-eslint'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['stories/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'],
      env: { browser: true, es6: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      globals: { NodeJS: true, Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['prettier', '@typescript-eslint'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
      },
      settings: {
        react: { version: 'detect' },
      },
    },
  ],
};
