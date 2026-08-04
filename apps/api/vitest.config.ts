import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    hookTimeout: 30_000,
    setupFiles: ['./tests/setup-env.ts'],
    testTimeout: 30_000,
  },
})
