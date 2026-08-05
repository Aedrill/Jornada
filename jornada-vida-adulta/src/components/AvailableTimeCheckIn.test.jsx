// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AvailableTimeCheckIn from './AvailableTimeCheckIn'

afterEach(cleanup)

function renderCheckIn(value = null) {
  const onChange = vi.fn()

  const view = render(
    <AvailableTimeCheckIn value={value} onChange={onChange} />,
  )

  return { ...view, onChange }
}

describe('AvailableTimeCheckIn', () => {
  it('mostra as opções de 5, 15, 30 e 60 minutos', () => {
    renderCheckIn()

    for (const minutes of [5, 15, 30, 60]) {
      expect(
        screen.getByRole('button', {
          name: `${minutes} minutos`,
        }),
      ).toBeTruthy()
    }
  })

  it('não mostra mais a opção Mais de 30', () => {
    renderCheckIn()

    expect(screen.queryByText('Mais de 30')).toBeNull()
  })

  it('abre o campo ao escolher Personalizado', () => {
    renderCheckIn()

    fireEvent.click(
      screen.getByRole('button', { name: 'Personalizado' }),
    )

    expect(
      screen.getByLabelText('Tempo disponível em minutos'),
    ).toBeTruthy()
  })

  it('envia um número personalizado válido', () => {
    const { onChange } = renderCheckIn()
    fireEvent.click(
      screen.getByRole('button', { name: 'Personalizado' }),
    )

    fireEvent.change(
      screen.getByLabelText('Tempo disponível em minutos'),
      { target: { value: '25' } },
    )

    expect(onChange).toHaveBeenLastCalledWith(25)
  })

  it.each(['0', '-2', '2.5', ''])(
    'rejeita o valor personalizado %s',
    (invalidValue) => {
      const { onChange } = renderCheckIn()
      fireEvent.click(
        screen.getByRole('button', { name: 'Personalizado' }),
      )

      fireEvent.change(
        screen.getByLabelText('Tempo disponível em minutos'),
        { target: { value: invalidValue } },
      )

      expect(onChange).toHaveBeenLastCalledWith(null)
      expect(
        screen.getByText(
          'Digite um número inteiro maior que zero.',
        ),
      ).toBeTruthy()
    },
  )

  it('esconde o campo ao voltar para uma opção pronta', () => {
    renderCheckIn()
    fireEvent.click(
      screen.getByRole('button', { name: 'Personalizado' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: '15 minutos' }),
    )

    expect(
      screen.queryByLabelText('Tempo disponível em minutos'),
    ).toBeNull()
  })

  it('marca Personalizado para um valor fora dos presets', () => {
    renderCheckIn(25)

    expect(
      screen
        .getByRole('button', { name: 'Personalizado' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
