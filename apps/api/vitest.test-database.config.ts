import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/test-database-url.test.ts'],
    environment: 'node',
  },
})
