import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetI18nForTests } from '../src/i18n/index.js'

vi.mock('recharts', async () => import('./mocks/recharts.mock.js'))

afterEach(async () => {
  cleanup()
  await resetI18nForTests()
})
