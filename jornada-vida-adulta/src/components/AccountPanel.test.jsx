// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import AccountPanel from './AccountPanel'

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const disconnectedAuth = {
  user: null,
  isLoading: false,
  isConfigured: true,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}

function fillCredentials(password = 'senha-segura') {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'pessoa@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: password },
  })
}

function submitAccountForm() {
  fireEvent.submit(screen.getByLabelText('E-mail').closest('form'))
}

describe('AccountPanel', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ ...disconnectedAuth })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('mostra aviso quando não está configurado', () => {
    useAuth.mockReturnValue({
      ...disconnectedAuth,
      isConfigured: false,
    })
    render(<AccountPanel />)

    expect(
      screen.getByText(
        'A conexão segura ainda não está configurada neste ambiente.',
      ),
    ).toBeTruthy()
    expect(screen.queryByLabelText('E-mail')).toBeNull()
  })

  it('mostra o estado de carregamento', () => {
    useAuth.mockReturnValue({
      ...disconnectedAuth,
      isLoading: true,
    })
    render(<AccountPanel />)

    expect(screen.getByRole('status').textContent).toContain(
      'Verificando sua conta...',
    )
  })

  it('mostra login e alterna para criação de conta', () => {
    render(<AccountPanel />)

    expect(screen.getByText('Entre na sua conta do NORTE.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(
      screen.getByText(
        'Crie uma conta para preparar a sincronização entre seus dispositivos.',
      ),
    ).toBeTruthy()
    expect(screen.getByLabelText('Senha').autocomplete).toBe(
      'new-password',
    )
  })

  it('valida e-mail obrigatório e senha mínima', () => {
    render(<AccountPanel />)
    submitAccountForm()
    expect(screen.getByRole('alert').textContent).toContain(
      'Digite seu e-mail.',
    )

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'pessoa@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'curta' },
    })
    submitAccountForm()
    expect(screen.getByRole('alert').textContent).toContain(
      'pelo menos 8 caracteres',
    )
  })

  it('chama signIn no login', async () => {
    const signIn = vi.fn().mockResolvedValue({ session: {} })
    useAuth.mockReturnValue({ ...disconnectedAuth, signIn })
    render(<AccountPanel />)
    fillCredentials()

    submitAccountForm()

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        'pessoa@example.com',
        'senha-segura',
      )
    })
  })

  it('chama signUp e orienta a confirmação por e-mail', async () => {
    const signUp = vi.fn().mockResolvedValue({ session: null })
    useAuth.mockReturnValue({ ...disconnectedAuth, signUp })
    render(<AccountPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
    fillCredentials()

    submitAccountForm()

    expect(
      await screen.findByText(
        'Conta criada. Confira seu e-mail para confirmar o cadastro.',
      ),
    ).toBeTruthy()
    expect(signUp).toHaveBeenCalledWith(
      'pessoa@example.com',
      'senha-segura',
    )
  })

  it('mostra o e-mail conectado e encerra somente a sessão', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    window.localStorage.setItem(
      'jornada:v2:missions',
      JSON.stringify([{ id: 'mission-1' }]),
    )
    useAuth.mockReturnValue({
      ...disconnectedAuth,
      user: { email: 'pessoa@example.com' },
      signOut,
    })
    render(<AccountPanel />)

    expect(screen.getByText('pessoa@example.com')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    expect(window.localStorage.getItem('jornada:v2:missions')).toBe(
      JSON.stringify([{ id: 'mission-1' }]),
    )
  })

  it('mostra erro seguro sem revelar detalhes internos', async () => {
    const signIn = vi.fn().mockRejectedValue({
      code: 'internal_error',
      token: 'segredo-que-não-pode-aparecer',
    })
    useAuth.mockReturnValue({ ...disconnectedAuth, signIn })
    render(<AccountPanel />)
    fillCredentials()

    submitAccountForm()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain(
      'Não foi possível concluir esta ação. Tente novamente.',
    )
    expect(alert.textContent).not.toContain('segredo')
  })
})
