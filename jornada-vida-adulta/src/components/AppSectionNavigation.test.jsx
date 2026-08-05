// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppSectionNavigation from './AppSectionNavigation'

afterEach(cleanup)

describe('AppSectionNavigation', () => {
  it('mostra Agora e Meus dados', () => {
    render(
      <AppSectionNavigation value="now" onChange={() => {}} />,
    )

    expect(
      screen.getByRole('button', { name: 'Agora' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Meus dados' }),
    ).toBeTruthy()
  })

  it('identifica a opção ativa como página atual', () => {
    render(
      <AppSectionNavigation value="data" onChange={() => {}} />,
    )

    expect(
      screen
        .getByRole('button', { name: 'Meus dados' })
        .getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen
        .getByRole('button', { name: 'Agora' })
        .hasAttribute('aria-current'),
    ).toBe(false)
  })

  it('executa onChange ao selecionar outra seção', () => {
    const onChange = vi.fn()
    render(
      <AppSectionNavigation value="now" onChange={onChange} />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Meus dados' }),
    )

    expect(onChange).toHaveBeenCalledWith('data')
  })
})
