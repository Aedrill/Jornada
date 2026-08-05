// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentSession,
  subscribeToAuthChanges,
} from '../services/authService'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
}))

vi.mock('../services/authService', () => ({
  getCurrentSession: vi.fn(),
  signInWithEmail: vi.fn(),
  signOut: vi.fn(),
  signUpWithEmail: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
}))

function AuthState() {
  const { isLoading, user } = useAuth()

  return (
    <p>
      {isLoading ? 'carregando' : user?.email ?? 'sem sessão'}
    </p>
  )
}

describe('AuthProvider', () => {
  let authChangeCallback
  let unsubscribe

  beforeEach(() => {
    authChangeCallback = null
    unsubscribe = vi.fn()
    subscribeToAuthChanges.mockImplementation((callback) => {
      authChangeCallback = callback
      return { unsubscribe }
    })
    getCurrentSession.mockResolvedValue(null)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('começa carregando', () => {
    getCurrentSession.mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    expect(screen.getByText('carregando')).toBeTruthy()
  })

  it('recupera uma sessão existente', async () => {
    getCurrentSession.mockResolvedValue({
      user: { email: 'pessoa@example.com' },
    })

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    expect(
      await screen.findByText('pessoa@example.com'),
    ).toBeTruthy()
  })

  it('representa a ausência de sessão', async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    expect(await screen.findByText('sem sessão')).toBeTruthy()
  })

  it('reage a login e logout', async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )
    await screen.findByText('sem sessão')

    act(() => {
      authChangeCallback('SIGNED_IN', {
        user: { email: 'pessoa@example.com' },
      })
    })
    expect(screen.getByText('pessoa@example.com')).toBeTruthy()

    act(() => authChangeCallback('SIGNED_OUT', null))
    expect(screen.getByText('sem sessão')).toBeTruthy()
  })

  it('cancela a inscrição ao desmontar', async () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )
    await waitFor(() => expect(getCurrentSession).toHaveBeenCalled())

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
