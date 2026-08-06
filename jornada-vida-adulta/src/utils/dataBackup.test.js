import { describe, expect, it, vi } from 'vitest'
import {
  BACKUP_SCHEMA_VERSION,
  createBackupFileName,
  createBackupPayload,
  createCanonicalBackupSnapshot,
  downloadBackupPayload,
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

  it('baixa exatamente o payload recebido e revoga a URL', () => {
    const payload = createBackupPayload(backupData)
    const click = vi.fn()
    const remove = vi.fn()
    const appendChild = vi.fn()
    const createObjectURL = vi.fn(() => 'blob:backup')
    const revokeObjectURL = vi.fn()
    const blobs = []
    class FakeBlob {
      constructor(parts, options) {
        this.parts = parts
        this.type = options.type
        blobs.push(this)
      }
    }
    const link = { click, remove }

    const fileName = downloadBackupPayload(payload, {
      date: new Date(2026, 7, 5, 13, 45),
      documentApi: {
        createElement: () => link,
        body: { appendChild },
      },
      urlApi: { createObjectURL, revokeObjectURL },
      BlobApi: FakeBlob,
    })

    expect(fileName).toBe('jornada-backup-2026-08-05-1345.json')
    expect(JSON.parse(blobs[0].parts[0])).toEqual(payload)
    expect(blobs[0].parts[0]).toBe(JSON.stringify(payload, null, 2))
    expect(blobs[0].type).toBe('application/json')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('não baixa payload inválido', () => {
    const createObjectURL = vi.fn()

    expect(() =>
      downloadBackupPayload(
        { app: 'outro' },
        { urlApi: { createObjectURL } },
      ),
    ).toThrow('invalid_backup_payload')
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('propaga falha ao iniciar o download e revoga a URL', () => {
    const payload = createBackupPayload(backupData)
    const revokeObjectURL = vi.fn()

    expect(() =>
      downloadBackupPayload(payload, {
        documentApi: {
          createElement: () => ({
            click: () => {
              throw new Error('private detail')
            },
            remove: vi.fn(),
          }),
          body: { appendChild: vi.fn() },
        },
        urlApi: {
          createObjectURL: () => 'blob:backup',
          revokeObjectURL,
        },
        BlobApi: class {},
      }),
    ).toThrow('backup_download_failed')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('cria snapshot canônico profundamente independente', () => {
    const payload = createBackupPayload({
      ...backupData,
      captures: [{ id: 'capture-1', detail: { text: 'original' } }],
    })

    const snapshot = createCanonicalBackupSnapshot(payload)

    expect(snapshot).toEqual(payload)
    expect(snapshot).not.toBe(payload)
    expect(snapshot.data).not.toBe(payload.data)
    expect(snapshot.data.captures).not.toBe(payload.data.captures)
    expect(snapshot.data.captures[0].detail).not.toBe(
      payload.data.captures[0].detail,
    )
  })

  it('não altera o snapshot quando o payload original é mutado', () => {
    const payload = createBackupPayload({
      ...backupData,
      dailyPlan: {
        dateKey: '2026-08-05',
        selection: { missionId: 'mission-1' },
      },
    })
    const snapshot = createCanonicalBackupSnapshot(payload)

    payload.data.dailyPlan.selection.missionId = 'mission-late'

    expect(snapshot.data.dailyPlan.selection.missionId).toBe(
      'mission-1',
    )
  })

  it('rejeita payload inválido ao criar snapshot canônico', () => {
    expect(() =>
      createCanonicalBackupSnapshot({ app: 'outro' }),
    ).toThrow('canonical_backup_failed')
  })

  it('rejeita valores não serializáveis', () => {
    const payload = createBackupPayload({
      ...backupData,
      captures: [{ id: 'capture-1', calculate: () => 1 }],
    })

    expect(() => createCanonicalBackupSnapshot(payload)).toThrow(
      'canonical_backup_failed',
    )
  })

  it('rejeita referências circulares', () => {
    const payload = createBackupPayload({
      ...backupData,
      dailyPlan: { ...backupData.dailyPlan },
    })
    payload.data.dailyPlan.circular = payload

    expect(() => createCanonicalBackupSnapshot(payload)).toThrow(
      'canonical_backup_failed',
    )
  })

  it('mantém schema 1 no snapshot canônico', () => {
    const snapshot = createCanonicalBackupSnapshot(
      createBackupPayload(backupData),
    )

    expect(snapshot.schemaVersion).toBe(1)
    expect(snapshot.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
  })
})
