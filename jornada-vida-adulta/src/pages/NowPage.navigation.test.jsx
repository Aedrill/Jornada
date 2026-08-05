// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import NowPage from './NowPage'

afterEach(cleanup)

beforeEach(() => {
  window.localStorage.clear()
})

describe('navegação de NowPage', () => {
  it('começa nas boas-vindas e mostra a navegação depois', () => {
    render(<NowPage />)

    expect(
      screen.getByRole('heading', { name: 'NORTE', level: 1 }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('navigation', {
        name: 'Seções do NORTE',
      }),
    ).toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Começar meu dia' }),
    )

    expect(
      screen.getByRole('navigation', {
        name: 'Seções do NORTE',
      }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Agora' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  it('separa a proteção dos dados do check-in', () => {
    render(<NowPage />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Começar meu dia' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Foque no Agora' }),
    ).toBeTruthy()
    expect(
      screen.queryByText('Proteção dos seus dados'),
    ).toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Meus dados' }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Proteção dos seus dados',
      }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Foque no Agora' }),
    ).toBeNull()

    fireEvent.click(
      screen.getByRole('button', { name: 'Agora' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Foque no Agora' }),
    ).toBeTruthy()
  })

  it('não altera o armazenamento apenas ao navegar', async () => {
    render(<NowPage />)

    await waitFor(() => {
      expect(window.localStorage.length).toBeGreaterThan(0)
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Começar meu dia' }),
    )

    const storedBeforeNavigation = Object.fromEntries(
      Object.keys(window.localStorage).map((key) => [
        key,
        window.localStorage.getItem(key),
      ]),
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Meus dados' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Agora' }),
    )

    expect(
      Object.fromEntries(
        Object.keys(window.localStorage).map((key) => [
          key,
          window.localStorage.getItem(key),
        ]),
      ),
    ).toEqual(storedBeforeNavigation)
  })
})
