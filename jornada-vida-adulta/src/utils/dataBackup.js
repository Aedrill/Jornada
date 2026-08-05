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
    app: 'jornada-a-vida-adulta',
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
