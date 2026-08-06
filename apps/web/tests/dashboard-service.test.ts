import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchDashboardSummary,
  resetDashboardRequestForTests,
} from '../src/features/dashboard/services/dashboard.service.js'
import { dashboardResponse } from './fixtures/dashboard.fixture.js'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('../src/services/api-client.js', () => ({
  apiClient: {
    get: getMock,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  resetDashboardRequestForTests()
  getMock.mockResolvedValue({ data: dashboardResponse })
})

describe('dashboard service', () => {
  it('requests the protected dashboard summary through the shared API client', async () => {
    const result = await fetchDashboardSummary()

    expect(getMock).toHaveBeenCalledWith('/dashboard/summary')
    expect(result).toEqual(dashboardResponse.data)
  })

  it('shares a concurrent request and starts a new request after it settles', async () => {
    const firstRequest = fetchDashboardSummary()
    const concurrentRequest = fetchDashboardSummary()

    await Promise.all([firstRequest, concurrentRequest])
    expect(getMock).toHaveBeenCalledTimes(1)

    await fetchDashboardSummary()
    expect(getMock).toHaveBeenCalledTimes(2)
  })
})
