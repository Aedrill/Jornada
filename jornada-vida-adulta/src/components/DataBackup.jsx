import { useState } from 'react'
import {
  createBackupFileName,
  createBackupPayload,
} from '../utils/dataBackup'

function DataBackup({
  captures,
  missions,
  activeFocusSession,
  focusSessions,
  dailyPlan,
}) {
  const [statusMessage, setStatusMessage] = useState('')

  function handleExport() {
    const payload = createBackupPayload({
      captures,
      missions,
      activeFocusSession,
      focusSessions,
      dailyPlan,
    })

    const fileContent = JSON.stringify(payload, null, 2)
    const fileBlob = new Blob(
      [fileContent],
      { type: 'application/json' },
    )
    const fileUrl = URL.createObjectURL(fileBlob)
    const downloadLink = document.createElement('a')

    downloadLink.href = fileUrl
    downloadLink.download = createBackupFileName()

    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()

    URL.revokeObjectURL(fileUrl)

    setStatusMessage(
      'Backup criado. Guarde o arquivo em um lugar seguro.',
    )
  }

  return (
    <section
      className="data-backup"
      aria-labelledby="data-backup-title"
    >
      <h2 id="data-backup-title">Proteção dos seus dados</h2>

      <p>
        Baixe uma cópia das suas capturas, missões,
        planejamento e histórico.
      </p>

      <button type="button" onClick={handleExport}>
        Baixar backup
      </button>

      {statusMessage && (
        <p role="status">{statusMessage}</p>
      )}
    </section>
  )
}

export default DataBackup
