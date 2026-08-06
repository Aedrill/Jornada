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
})
