// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WelcomeScreen from './WelcomeScreen'

afterEach(cleanup)

describe('WelcomeScreen', () => {
  it('mostra a identidade NORTE', () => {
    render(<WelcomeScreen onContinue={() => {}} />)

    expect(
      screen.getByRole('heading', { name: 'NORTE', level: 1 }),
    ).toBeTruthy()
  })

  it('mostra a frase oficial', () => {
    render(<WelcomeScreen onContinue={() => {}} />)

    expect(
      screen.getByText(
        'Uma jornada divertida e gentil pela vida adulta.',
      ),
    ).toBeTruthy()
  })

  it('executa onContinue ao começar o dia', () => {
    const onContinue = vi.fn()
    render(<WelcomeScreen onContinue={onContinue} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Começar meu dia' }),
    )

    expect(onContinue).toHaveBeenCalledOnce()
  })
})
