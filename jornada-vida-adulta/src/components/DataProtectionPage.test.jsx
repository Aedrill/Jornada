// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import DataProtectionPage from './DataProtectionPage'

afterEach(cleanup)

function renderDataProtectionPage() {
  render(
    <DataProtectionPage
      captures={[]}
      missions={[]}
      activeFocusSession={null}
      focusSessions={[]}
      dailyPlan={{ dateKey: '2026-08-05', selections: {} }}
      onRestore={() => {}}
    />,
  )
}

describe('DataProtectionPage', () => {
  it('mostra o título e o texto explicativo', () => {
    renderDataProtectionPage()

    expect(
      screen.getByRole('heading', {
        name: 'Meus dados',
        level: 1,
      }),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Crie uma cópia segura das suas informações ou restaure um backup anterior.',
      ),
    ).toBeTruthy()
  })

  it('apresenta a proteção e as ações de backup', () => {
    renderDataProtectionPage()

    expect(
      screen.getByRole('heading', {
        name: 'Proteção dos seus dados',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Baixar backup' }),
    ).toBeTruthy()
    expect(
      screen.getByLabelText('Escolher arquivo de backup'),
    ).toBeTruthy()
  })
})
