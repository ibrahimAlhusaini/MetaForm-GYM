import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'apps/api/src/generated/**',
      'data-science/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
    },
  },
  {
    files: [
      'apps/api/prisma.config.ts',
      'apps/api/vitest.config.ts',
      'apps/web/vitest.config.ts',
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts', '*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
)
