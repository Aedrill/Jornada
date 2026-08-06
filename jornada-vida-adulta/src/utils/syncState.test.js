import { describe, expect, it } from 'vitest'
import { createBackupPayload } from './dataBackup'
import {
  SYNC_STATE_KEY,
  classifySyncState,
  createSnapshotSummary,
  createSyncReference,
  readSyncState,
} from './syncState'

const userId = '11111111-1111-4111-8111-111111111111'
const snapshot = (missions = [], exportedAt = '2026-08-06T12:00:00.000Z') => createBackupPayload({
  captures: [], missions, activeFocusSession: null, focusSessions: [],
  dailyPlan: { dateKey: '2026-08-06' }, exportedAt,
})

describe('syncState', () => {
  it('ignora metadados inválidos e de outra conta', () => {
    let stored = '{'
    const storage = { getItem: () => stored }
    expect(readSyncState(userId, storage)).toBeNull()
    stored = JSON.stringify(createSyncReference('outro', { revision: 1, stateData: snapshot() }))
    expect(readSyncState(userId, storage)).toBeNull()
    stored = JSON.stringify({ version: 1, userId, baseRevision: 0, baseSnapshot: snapshot(), linkedAt: 'x', lastCheckedAt: 'x' })
    expect(readSyncState(userId, storage)).toBeNull()
  })

  it.each([
    ['in_sync', snapshot(), { revision: 1, stateData: snapshot() }],
    ['local_ahead', snapshot([{ status: 'active' }]), { revision: 1, stateData: snapshot() }],
    ['remote_ahead', snapshot(), { revision: 2, stateData: snapshot() }],
    ['remote_ahead', snapshot(), { revision: 1, stateData: snapshot([{ status: 'active' }]) }],
    ['conflict', snapshot([{ status: 'active' }]), { revision: 2, stateData: snapshot([{ status: 'completed' }]) }],
  ])('classifica %s', (expected, local, remote) => {
    const reference = createSyncReference(userId, { revision: 1, stateData: snapshot() })
    expect(classifySyncState(local, remote, reference)).toBe(expected)
  })

  it('cria snapshot de referência profundamente independente', () => {
    const remote = { revision: 1, stateData: snapshot([{ status: 'active' }]) }
    const reference = createSyncReference(userId, remote)
    remote.stateData.data.missions[0].status = 'completed'
    expect(reference.baseSnapshot.data.missions[0].status).toBe('active')
  })

  it('gera somente o resumo seguro', () => {
    const summary = createSnapshotSummary(snapshot([{ status: 'active', title: 'segredo' }]))
    expect(summary).toMatchObject({ missions: 1, activeMissions: 1, completedMissions: 0 })
    expect(JSON.stringify(summary)).not.toContain('segredo')
  })
})
