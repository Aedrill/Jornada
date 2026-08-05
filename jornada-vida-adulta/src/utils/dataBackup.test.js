import { describe, expect, it } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  createBackupFileName,
  createBackupPayload,
  parseBackupText,
  prepareBackupDataForRestore,
  validateBackupPayload,
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

  it('aceita um backup válido', () => {
    const payload = createBackupPayload(backupData)

    expect(validateBackupPayload(payload)).toEqual({
      isValid: true,
      error: '',
    })
  })

  it('recusa JSON malformado', () => {
    const result = parseBackupText('{"app":')

    expect(result.isValid).toBe(false)
    expect(result.error).toBe(
      'Não foi possível ler o arquivo JSON.',
    )
  })

  it('recusa arquivo de outro aplicativo', () => {
    const payload = {
      ...createBackupPayload(backupData),
      app: 'outro-aplicativo',
    }

    expect(validateBackupPayload(payload).isValid).toBe(false)
  })

  it('recusa schemaVersion não suportado', () => {
    const payload = {
      ...createBackupPayload(backupData),
      schemaVersion: BACKUP_SCHEMA_VERSION + 1,
    }

    expect(validateBackupPayload(payload).isValid).toBe(false)
  })

  it('recusa coleções de dados inválidas', () => {
    const payload = createBackupPayload({
      ...backupData,
      captures: {},
    })

    expect(validateBackupPayload(payload).isValid).toBe(false)
  })

  it('mantém activeFocusSession null', () => {
    const payload = createBackupPayload({
      ...backupData,
      activeFocusSession: null,
    })

    expect(
      prepareBackupDataForRestore(payload).activeFocusSession,
    ).toBeNull()
  })

  it('restaura a sessão ativa pausada com o tempo restante exportado', () => {
    const activeFocusSession = {
      id: 'focus-1',
      missionId: 'mission-1',
      plannedMinutes: 5,
      startedAt: '2026-08-05T13:00:00.000Z',
      remainingSeconds: 300,
      isTimerRunning: true,
      lastTimerStartedAt: '2026-08-05T13:00:00.000Z',
    }
    const payload = createBackupPayload({
      ...backupData,
      activeFocusSession,
      exportedAt: '2026-08-05T13:01:00.000Z',
    })

    expect(
      prepareBackupDataForRestore(payload).activeFocusSession,
    ).toEqual({
      ...activeFocusSession,
      remainingSeconds: 240,
      isTimerRunning: false,
      lastTimerStartedAt: null,
    })
  })
})
