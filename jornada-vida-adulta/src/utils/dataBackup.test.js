import { describe, expect, it } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  createBackupFileName,
  createBackupPayload,
} from './dataBackup'

const backupData = {
  captures: [{ id: 'capture-1' }],
  missions: [{ id: 'mission-1' }],
  activeFocusSession: { id: 'active-session-1' },
  focusSessions: [{ id: 'session-1' }],
  dailyPlan: { dateKey: '2026-08-05' },
}

describe('dataBackup', () => {
  it('inclui o aplicativo e a versão do schema no payload', () => {
    const payload = createBackupPayload(backupData)

    expect(payload.app).toBe('jornada-a-vida-adulta')
    expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
  })

  it('preserva todos os conjuntos de dados recebidos', () => {
    const payload = createBackupPayload(backupData)

    expect(payload.data).toEqual(backupData)
  })

  it('permite definir exportedAt de forma determinística', () => {
    const exportedAt = '2026-08-05T16:45:00.000Z'

    const payload = createBackupPayload({
      ...backupData,
      exportedAt,
    })

    expect(payload.exportedAt).toBe(exportedAt)
  })

  it('usa a data e a hora locais no nome do arquivo', () => {
    const date = new Date(2026, 7, 5, 13, 45)

    expect(createBackupFileName(date)).toBe(
      'jornada-backup-2026-08-05-1345.json',
    )
  })

  it('cria um nome de arquivo terminado em .json', () => {
    expect(createBackupFileName()).toMatch(/\.json$/)
  })
})
