// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadBackupPayload } from '../utils/dataBackup'
import DataBackup from './DataBackup'

vi.mock('../utils/dataBackup', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    downloadBackupPayload: vi.fn(),
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DataBackup', () => {
  it('continua exportando o payload canônico completo', () => {
    const props = {
      captures: [{ id: 'capture-1' }],
      missions: [{ id: 'mission-1' }],
      activeFocusSession: null,
      focusSessions: [{ id: 'focus-1' }],
      dailyPlan: { dateKey: '2026-08-05' },
      onRestore: vi.fn(),
    }
    render(<DataBackup {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Baixar backup' }),
    )

    expect(downloadBackupPayload).toHaveBeenCalledWith({
      app: 'jornada-a-vida-adulta',
      schemaVersion: 1,
      exportedAt: expect.any(String),
      data: {
        captures: props.captures,
        missions: props.missions,
        activeFocusSession: null,
        focusSessions: props.focusSessions,
        dailyPlan: props.dailyPlan,
      },
    })
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('mostra somente a mensagem mais recente da exportação', () => {
    const props = {
      captures: [],
      missions: [],
      activeFocusSession: null,
      focusSessions: [],
      dailyPlan: { dateKey: '2026-08-05' },
      onRestore: vi.fn(),
    }
    downloadBackupPayload
      .mockImplementationOnce(() => {
        throw new Error('private detail')
      })
      .mockReturnValueOnce('jornada-backup.json')
    render(<DataBackup {...props} />)
    const exportButton = screen.getByRole('button', {
      name: 'Baixar backup',
    })

    fireEvent.click(exportButton)
    expect(screen.getByRole('alert')).toBeTruthy()

    fireEvent.click(exportButton)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('status').textContent).toContain(
      'Backup criado',
    )
  })
})
