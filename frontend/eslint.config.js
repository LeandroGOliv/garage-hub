import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    '.claude/**',
    // Nao pertence a nenhum tsconfig -> o lint type-aware nao consegue analisar.
    'eslint.config.js',
    // Gerado pelo @tanstack/router-plugin; o proprio arquivo pede exclusao.
    'src/routeTree.gen.ts',
  ]),

  // Base compartilhada TanStack: JS + TS + import + node + stylistic.
  ...tanstackConfig,

  // tanstackConfig usa `project: true`, que nao resolve tsconfig solution-style
  // (nosso tsconfig.json e apenas um indice com `references`). `projectService`
  // resolve e e a forma recomendada no typescript-eslint v8.
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: null,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      ...pluginQuery.configs['flat/recommended'],
      ...pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  {
    // Rotas file-based exportam o objeto `Route` e mantem o componente local
    // (nao exportado) porque exporta-lo desativa o autoCodeSplitting do
    // @tanstack/router-plugin. A regra nao expressa essa combinacao:
    // `allowExportNames` faz o `Route` sair da contagem, e o componente local
    // passa a ser reportado via `localComponents`. HMR e splitting das rotas
    // sao responsabilidade do router-plugin, nao do react-refresh.
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // root-provider expoe getContext() junto do Provider.
    files: ['src/integrations/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['getContext'] },
      ],
    },
  },
])
