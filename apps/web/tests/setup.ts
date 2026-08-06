import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.mock('recharts', async () => import('./mocks/recharts.mock.js'))

afterEach(() => {
  cleanup()
})
