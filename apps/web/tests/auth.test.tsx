import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../src/pages/LoginPage.js'
import { RegisterPage } from '../src/pages/RegisterPage.js'
import { AppRoutes } from '../src/routes/AppRoutes.js'
import { AuthInitializer } from '../src/routes/AuthInitializer.js'
import {
  resetAuthStoreForTests,
  useAuthStore,
} from '../src/store/auth.store.js'
import {
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerRequest,
} from '../src/services/auth.service.js'
import { authResponse, user } from './fixtures/auth.fixture.js'

vi.mock('../src/services/auth.service.js', () => ({
  fetchCurrentUserRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshSessionRequest: vi.fn(),
  registerRequest: vi.fn(),
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )

beforeEach(() => {
  resetAuthStoreForTests()
  localStorage.clear()
  sessionStorage.clear()
  vi.mocked(fetchCurrentUserRequest).mockResolvedValue(user)
  vi.mocked(loginRequest).mockResolvedValue(authResponse)
  vi.mocked(registerRequest).mockResolvedValue(authResponse)
  vi.mocked(logoutRequest).mockResolvedValue(undefined)
  vi.mocked(refreshSessionRequest).mockResolvedValue('restored-access-token')
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('authentication forms', () => {
  it('validates the login form', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Enter a valid email address')).toBeVisible()
    expect(screen.getByText('Password is required')).toBeVisible()
    expect(loginRequest).not.toHaveBeenCalled()
  })

  it('validates every registration password rule', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )
    await actor.type(screen.getByLabelText('Full name'), 'Test User')
    await actor.type(screen.getByLabelText('Email address'), 'test@example.com')
    await actor.type(screen.getByLabelText('Password'), 'weak')
    await actor.type(screen.getByLabelText('Confirm password'), 'weak')
    await actor.click(screen.getByRole('button', { name: 'Create account' }))
    expect(
      await screen.findByText('Password must be at least 10 characters'),
    ).toBeVisible()
    expect(registerRequest).not.toHaveBeenCalled()
  })

  it('rejects a mismatched confirmation password', async () => {
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )
    await actor.type(screen.getByLabelText('Full name'), 'Test User')
    await actor.type(screen.getByLabelText('Email address'), 'test@example.com')
    await actor.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await actor.type(
      screen.getByLabelText('Confirm password'),
      'DifferentPass1!',
    )
    await actor.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Passwords do not match')).toBeVisible()
  })

  it('logs in successfully and normalizes the email', async () => {
    const actor = userEvent.setup()
    renderAt('/login')
    await actor.type(
      screen.getByLabelText('Email address'),
      ' MEMBER@EXAMPLE.COM ',
    )
    await actor.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await actor.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Meta Member' }),
    ).toBeVisible()
    expect(loginRequest).toHaveBeenCalledWith({
      email: 'member@example.com',
      password: 'SecurePass1!',
    })
  })

  it('shows the safe invalid-credentials message', async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new Error('Invalid email or password'),
    )
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    await actor.type(
      screen.getByLabelText('Email address'),
      'member@example.com',
    )
    await actor.type(screen.getByLabelText('Password'), 'WrongPassword1!')
    await actor.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
  })

  it('shows the safe duplicate-registration message', async () => {
    vi.mocked(registerRequest).mockRejectedValue(
      new Error('An account with this email already exists'),
    )
    const actor = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    )
    await actor.type(screen.getByLabelText('Full name'), 'Test User')
    await actor.type(
      screen.getByLabelText('Email address'),
      'member@example.com',
    )
    await actor.type(screen.getByLabelText('Password'), 'SecurePass1!')
    await actor.type(screen.getByLabelText('Confirm password'), 'SecurePass1!')
    await actor.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists',
    )
  })
})

describe('routing and session lifecycle', () => {
  it('redirects a guest away from a protected route', () => {
    useAuthStore.setState({ isInitializing: false })
    renderAt('/app')
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  it('redirects an authenticated user away from a guest route', () => {
    useAuthStore.setState({
      isInitializing: false,
      isAuthenticated: true,
      user,
    })
    renderAt('/login')
    expect(
      screen.getByRole('heading', { name: 'Welcome back, Meta Member' }),
    ).toBeVisible()
  })

  it('shows a full-page loading state during initialization', () => {
    vi.mocked(refreshSessionRequest).mockReturnValue(Promise.race<string>([]))
    render(
      <AuthInitializer>
        <p>Protected content</p>
      </AuthInitializer>,
    )
    expect(screen.getByText('Restoring your session…')).toBeVisible()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('restores a valid refresh-cookie session', async () => {
    render(
      <AuthInitializer>
        <p>Application ready</p>
      </AuthInitializer>,
    )
    expect(await screen.findByText('Application ready')).toBeVisible()
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'restored-access-token',
      isAuthenticated: true,
      user,
    })
  })

  it('clears authentication when refresh fails', async () => {
    vi.mocked(refreshSessionRequest).mockRejectedValue(
      new Error('Session expired'),
    )
    useAuthStore.setState({
      accessToken: 'old-token',
      isAuthenticated: true,
      user,
    })
    render(
      <AuthInitializer>
        <p>Application ready</p>
      </AuthInitializer>,
    )
    await waitFor(() => {
      expect(useAuthStore.getState().isInitializing).toBe(false)
    })
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      isAuthenticated: false,
      user: null,
    })
  })

  it('clears state after logout', async () => {
    useAuthStore.setState({
      accessToken: 'access-token',
      isAuthenticated: true,
      isInitializing: false,
      user,
    })
    renderAt('/app')
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeVisible()
    expect(logoutRequest).toHaveBeenCalledOnce()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('never persists the access token in browser storage', () => {
    useAuthStore.getState().setAccessToken('memory-only-token')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
