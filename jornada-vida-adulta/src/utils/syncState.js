import { createCanonicalBackupSnapshot, validateBackupPayload } from './dataBackup'
import { areJsonValuesEqual } from './jsonEquality'

export const SYNC_STATE_KEY = 'jornada:v2:sync-state'
export const SYNC_STATE_VERSION = 1

function isValidDate(value) {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime())
}

export function validateSyncState(value, userId) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      value.version !== SYNC_STATE_VERSION || value.userId !== userId ||
      !Number.isInteger(value.baseRevision) || value.baseRevision <= 0 ||
      !validateBackupPayload(value.baseSnapshot).isValid ||
      !isValidDate(value.linkedAt) || !isValidDate(value.lastCheckedAt)) return null

  try {
    return { ...value, baseSnapshot: createCanonicalBackupSnapshot(value.baseSnapshot) }
  } catch {
    return null
  }
}

export function readSyncState(userId, storage = globalThis.localStorage) {
  try {
    return validateSyncState(JSON.parse(storage.getItem(SYNC_STATE_KEY)), userId)
  } catch {
    return null
  }
}

export function createSyncReference(userId, remote, checkedAt = new Date().toISOString()) {
  if (!Number.isInteger(remote?.revision) || remote.revision <= 0 ||
      !validateBackupPayload(remote?.stateData).isValid) throw new Error('invalid_sync_reference')

  return {
    version: SYNC_STATE_VERSION,
    userId,
    baseRevision: remote.revision,
    baseSnapshot: createCanonicalBackupSnapshot(remote.stateData),
    linkedAt: checkedAt,
    lastCheckedAt: checkedAt,
  }
}

export function classifySyncState(localSnapshot, remote, reference) {
  const localChanged = !areJsonValuesEqual(localSnapshot, reference.baseSnapshot)
  const remoteChanged = remote.revision !== reference.baseRevision ||
    !areJsonValuesEqual(remote.stateData, reference.baseSnapshot)

  if (!localChanged && !remoteChanged) return 'in_sync'
  if (localChanged && !remoteChanged) return 'local_ahead'
  if (!localChanged && remoteChanged) return 'remote_ahead'
  return 'conflict'
}

export function createSnapshotSummary(snapshot) {
  if (!validateBackupPayload(snapshot).isValid) throw new Error('invalid_snapshot_summary')
  const { data } = snapshot
  return {
    createdAt: snapshot.exportedAt,
    captures: data.captures.length,
    missions: data.missions.length,
    activeMissions: data.missions.filter(({ status }) => status === 'active').length,
    completedMissions: data.missions.filter(({ status }) => status === 'completed').length,
    focusSessions: data.focusSessions.length,
    hasActiveFocus: Boolean(data.activeFocusSession),
    dailyPlanDate: data.dailyPlan.dateKey || 'Não informado',
    schemaVersion: snapshot.schemaVersion,
  }
}
