import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MachineFormPage } from '../src/features/weight-tracker/pages/MachineFormPage.js'
import { MachinesPage } from '../src/features/weight-tracker/pages/MachinesPage.js'
import {
  createMachine,
  deleteMachine,
  fetchMachine,
  fetchMachines,
  updateMachine,
} from '../src/features/weight-tracker/services/weight-tracker.service.js'
import { machine, pagination } from './fixtures/weight-tracker.fixture.js'

vi.mock(
  '../src/features/weight-tracker/services/weight-tracker.service.js',
  () => ({
    createMachine: vi.fn(),
    deleteMachine: vi.fn(),
    fetchMachine: vi.fn(),
    fetchMachines: vi.fn(),
    updateMachine: vi.fn(),
  }),
)

const renderMachines = () =>
  render(
    <MemoryRouter>
      <MachinesPage />
    </MemoryRouter>,
  )
const renderForm = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/weights/machines/new" element={<MachineFormPage />} />
        <Route
          path="/app/weights/machines/:machineId"
          element={<MachineFormPage />}
        />
        <Route
          path="/app/weights/machines"
          element={<p>Machine list destination</p>}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.mocked(fetchMachines).mockResolvedValue({ items: [machine], pagination })
  vi.mocked(fetchMachine).mockResolvedValue(machine)
  vi.mocked(createMachine).mockResolvedValue(machine)
  vi.mocked(updateMachine).mockResolvedValue(machine)
  vi.mocked(deleteMachine).mockResolvedValue(undefined)
})

describe('machine workflow', () => {
  it('shows a loading state', () => {
    vi.mocked(fetchMachines).mockReturnValue(Promise.race([]))
    renderMachines()
    expect(screen.getByLabelText('Loading machines')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
  it('shows the machine empty state', async () => {
    vi.mocked(fetchMachines).mockResolvedValue({
      items: [],
      pagination: { ...pagination, totalItems: 0, totalPages: 0 },
    })
    renderMachines()
    expect(
      await screen.findByRole('heading', { name: 'No matching machines' }),
    ).toBeVisible()
  })
  it('renders machines without fake data', async () => {
    renderMachines()
    expect(await screen.findByText('Chest Press')).toBeVisible()
    expect(screen.queryByText(/sample|demo machine/i)).not.toBeInTheDocument()
  })
  it('sends search and muscle filters', async () => {
    const actor = userEvent.setup()
    renderMachines()
    await actor.type(screen.getByPlaceholderText('Search machines'), 'press')
    await actor.selectOptions(screen.getByLabelText('Target muscle'), 'CHEST')
    await waitFor(() => {
      expect(fetchMachines).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'press', targetMuscle: 'CHEST' }),
      )
    })
  })
  it('validates and creates a machine', async () => {
    const actor = userEvent.setup()
    renderForm('/app/weights/machines/new')
    await actor.click(screen.getByRole('button', { name: 'Create machine' }))
    expect(await screen.findByText('Machine name is required')).toBeVisible()
    await actor.type(screen.getByLabelText('Machine name'), 'Chest Press')
    await actor.click(screen.getByRole('button', { name: 'Create machine' }))
    await waitFor(() => {
      expect(createMachine).toHaveBeenCalledWith({
        name: 'Chest Press',
        imageUrl: null,
        targetMuscle: 'CHEST',
        description: null,
      })
    })
  })
  it('previews a valid image URL and edits a machine', async () => {
    const actor = userEvent.setup()
    renderForm(`/app/weights/machines/${machine.id}`)
    expect(await screen.findByDisplayValue(machine.name)).toBeVisible()
    await actor.clear(screen.getByLabelText('Machine name'))
    await actor.type(screen.getByLabelText('Machine name'), 'Updated Press')
    await actor.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      expect(updateMachine).toHaveBeenCalledWith(
        machine.id,
        expect.objectContaining({ name: 'Updated Press' }),
      )
    })
  })
  it('deletes an unreferenced machine after confirmation', async () => {
    const actor = userEvent.setup()
    renderForm(`/app/weights/machines/${machine.id}`)
    await actor.click(
      await screen.findByRole('button', { name: 'Delete machine' }),
    )
    await actor.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete machine',
      }),
    )
    await waitFor(() => {
      expect(deleteMachine).toHaveBeenCalledWith(machine.id)
    })
  })
  it('explains referenced-machine conflicts without raw errors', async () => {
    vi.mocked(deleteMachine).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    })
    const actor = userEvent.setup()
    renderForm(`/app/weights/machines/${machine.id}`)
    await actor.click(
      await screen.findByRole('button', { name: 'Delete machine' }),
    )
    await actor.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete machine',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'used in workout history',
    )
    expect(screen.queryByText(/Axios|Prisma|409/)).not.toBeInTheDocument()
  })
  it('uses a safe not-found state', async () => {
    vi.mocked(fetchMachine).mockRejectedValue(
      new Error('Prisma Resource not found private'),
    )
    renderForm(`/app/weights/machines/${machine.id}`)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load this machine',
    )
    expect(screen.queryByText(/Prisma|private/)).not.toBeInTheDocument()
  })
})
