import { useState } from 'react'
import {
  createBackupPayload,
  downloadBackupPayload,
  parseBackupText,
} from '../utils/dataBackup'

function DataBackup({
  captures,
  missions,
  activeFocusSession,
  focusSessions,
  dailyPlan,
  onRestore,
}) {
  const [statusMessage, setStatusMessage] = useState('')
  const [pendingBackup, setPendingBackup] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isConfirmingRestore, setIsConfirmingRestore] =
    useState(false)

  function handleExport() {
    const payload = createBackupPayload({
      captures,
      missions,
      activeFocusSession,
      focusSessions,
      dailyPlan,
    })

    try {
      downloadBackupPayload(payload)
      setStatusMessage(
        'Backup criado. Guarde o arquivo em um lugar seguro.',
      )
    } catch {
      setErrorMessage(
        'Não foi possível baixar o backup. Tente novamente.',
      )
    }
  }

  async function handleBackupFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setStatusMessage('')
    setErrorMessage('')
    setPendingBackup(null)
    setIsConfirmingRestore(false)

    try {
      const fileText = await file.text()
      const result = parseBackupText(fileText)

      if (!result.isValid) {
        setErrorMessage(result.error)
        return
      }

      setPendingBackup({
        payload: result.payload,
        data: result.data,
        fileName: file.name,
      })

      setStatusMessage(
        'Backup válido. Revise o resumo antes de restaurar.',
      )
    } catch {
      setErrorMessage(
        'Não foi possível abrir o arquivo selecionado.',
      )
    } finally {
      event.target.value = ''
    }
  }

  function handleConfirmRestore() {
    if (!pendingBackup) {
      return
    }

    onRestore(pendingBackup.data)

    setPendingBackup(null)
    setIsConfirmingRestore(false)
    setErrorMessage('')
    setStatusMessage('Backup restaurado com sucesso.')
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

      <div className="data-backup-restore">
        <h3>Restaurar uma cópia</h3>

        <p>
          Escolha um backup criado pelo Jornada. Nenhum dado
          será alterado antes da sua confirmação.
        </p>

        <label htmlFor="backup-file-input">
          Escolher arquivo de backup
        </label>

        <input
          id="backup-file-input"
          type="file"
          accept=".json,application/json"
          onChange={handleBackupFileChange}
        />

        {errorMessage && (
          <p className="backup-error" role="alert">
            {errorMessage}
          </p>
        )}

        {pendingBackup && (
          <div className="backup-preview">
            <h4>Backup encontrado</h4>

            <p>
              Arquivo: <strong>{pendingBackup.fileName}</strong>
            </p>

            <p>
              Exportado em:{' '}
              <strong>
                {new Date(
                  pendingBackup.payload.exportedAt,
                ).toLocaleString('pt-BR')}
              </strong>
            </p>

            <ul>
              <li>
                Capturas: {pendingBackup.data.captures.length}
              </li>
              <li>
                Missões: {pendingBackup.data.missions.length}
              </li>
              <li>
                Sessões de foco:{' '}
                {pendingBackup.data.focusSessions.length}
              </li>
            </ul>

            {!isConfirmingRestore && (
              <button
                type="button"
                onClick={() => setIsConfirmingRestore(true)}
              >
                Restaurar este backup
              </button>
            )}

            {isConfirmingRestore && (
              <div
                className="backup-confirmation"
                role="alert"
              >
                <p>
                  Isso substituirá as capturas, missões,
                  planejamento e histórico atuais deste
                  navegador.
                </p>

                <div className="backup-actions">
                  <button
                    className="danger-button"
                    type="button"
                    onClick={handleConfirmRestore}
                  >
                    Confirmar restauração
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setIsConfirmingRestore(false)
                    }
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {statusMessage && (
        <p role="status">{statusMessage}</p>
      )}
    </section>
  )
}

export default DataBackup
