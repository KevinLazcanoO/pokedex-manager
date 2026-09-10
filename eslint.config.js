import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'apps/api/prisma/*.db'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Las variables fantasma (declaradas y nunca usadas) son un error, no un aviso:
      // suelen ser restos de un refactor a medias y ensucian la lectura del codigo.
      // Se permite el prefijo `_` para los parametros que la firma obliga a declarar.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' },
      ],
      // Preferir `import type` deja claro que es solo un tipo y se borra al compilar.
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  {
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Avisa si un archivo exporta algo que no es un componente: eso rompe el
      // recargado en caliente y hace perder el estado en cada guardado.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    // El arranque del servidor si necesita escribir en consola.
    files: [
      'apps/api/src/index.ts',
      'apps/api/src/config/env.ts',
      'apps/api/src/middleware/error-handler.ts',
      'apps/api/src/services/analysis.service.ts',
      'scripts/**/*.mjs',
    ],
    rules: { 'no-console': 'off' },
  },
);
