import { getRemainingSeconds } from './focusTimer'

const BACKUP_APP_ID = 'jornada-a-vida-adulta'

export const BACKUP_SCHEMA_VERSION = 1

export function createBackupPayload({
  captures,
  missions,
  activeFocusSession,
  focusSessions,
  dailyPlan,
  exportedAt = new Date().toISOString(),
}) {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    data: {
      captures,
      missions,
      activeFocusSession,
      focusSessions,
      dailyPlan,
    },
  }
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value),
  )
}

export function validateBackupPayload(payload) {
  if (!isPlainObject(payload)) {
    return {
      isValid: false,
      error: 'O arquivo não contém um backup válido.',
    }
  }

  if (payload.app !== BACKUP_APP_ID) {
    return {
      isValid: false,
      error: 'Este arquivo não pertence ao Jornada.',
    }
  }

  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return {
      isValid: false,
      error:
        'Esta versão do backup ainda não é compatível.',
    }
  }

  const exportedAtMilliseconds = new Date(
    payload.exportedAt,
  ).getTime()

  if (!Number.isFinite(exportedAtMilliseconds)) {
    return {
      isValid: false,
      error: 'A data de exportação do backup é inválida.',
    }
  }

  const data = payload.data

  if (!isPlainObject(data)) {
    return {
      isValid: false,
      error: 'Os dados do backup estão ausentes.',
    }
  }

  if (
    !Array.isArray(data.captures) ||
    !Array.isArray(data.missions) ||
    !Array.isArray(data.focusSessions) ||
    !isPlainObject(data.dailyPlan) ||
    !(
      data.activeFocusSession === null ||
      isPlainObject(data.activeFocusSession)
    )
  ) {
    return {
      isValid: false,
      error: 'A estrutura dos dados do backup é inválida.',
    }
  }

  return {
    isValid: true,
    error: '',
  }
}

export function prepareBackupDataForRestore(payload) {
  const activeFocusSession =
    payload.data.activeFocusSession

  const restoredActiveFocusSession =
    activeFocusSession
      ? {
          ...activeFocusSession,
          remainingSeconds: getRemainingSeconds(
            activeFocusSession,
            new Date(payload.exportedAt).getTime(),
          ),
          isTimerRunning: false,
          lastTimerStartedAt: null,
        }
      : null

  return {
    ...payload.data,
    activeFocusSession: restoredActiveFocusSession,
  }
}

export function parseBackupText(text) {
  let payload

  try {
    payload = JSON.parse(text)
  } catch {
    return {
      isValid: false,
      error: 'Não foi possível ler o arquivo JSON.',
      payload: null,
      data: null,
    }
  }

  const validation = validateBackupPayload(payload)

  if (!validation.isValid) {
    return {
      ...validation,
      payload: null,
      data: null,
    }
  }

  return {
    isValid: true,
    error: '',
    payload,
    data: prepareBackupDataForRestore(payload),
  }
}

export function createBackupFileName(
  date = new Date(),
) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `jornada-backup-${year}-${month}-${day}-${hours}${minutes}.json`
}
