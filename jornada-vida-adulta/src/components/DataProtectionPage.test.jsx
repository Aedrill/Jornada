// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import DataProtectionPage from './DataProtectionPage'

afterEach(cleanup)

function renderDataProtectionPage() {
  render(
    <AuthProvider>
      <DataProtectionPage
        captures={[]}
        missions={[]}
        activeFocusSession={null}
        focusSessions={[]}
        dailyPlan={{ dateKey: '2026-08-05', selections: {} }}
        onRestore={() => {}}
      />
    </AuthProvider>,
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

  it('apresenta a conta antes da proteção dos dados', () => {
    renderDataProtectionPage()

    const accountTitle = screen.getByRole('heading', {
      name: 'Sua conta',
    })
    const backupTitle = screen.getByRole('heading', {
      name: 'Proteção dos seus dados',
    })

    expect(
      accountTitle.compareDocumentPosition(backupTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('apresenta conta, cópia na nuvem e backup nesta ordem', () => {
    renderDataProtectionPage()

    const accountTitle = screen.getByRole('heading', {
      name: 'Sua conta',
    })
    const cloudTitle = screen.getByRole('heading', {
      name: 'Cópia segura na nuvem',
    })
    const backupTitle = screen.getByRole('heading', {
      name: 'Proteção dos seus dados',
    })

    expect(
      accountTitle.compareDocumentPosition(cloudTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      cloudTitle.compareDocumentPosition(backupTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
