import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  createInitialUserState,
  getUserState,
  getUserStateErrorMessage,
} from '../services/userStateService'
import {
  createCanonicalBackupSnapshot,
  createBackupPayload,
  downloadBackupPayload,
} from '../utils/dataBackup'
import { areJsonValuesEqual } from '../utils/jsonEquality'
import {
  SYNC_STATE_KEY,
  classifySyncState,
  createSnapshotSummary,
  createSyncReference,
  readSyncState,
} from '../utils/syncState'

const COMPARISON_COPY = {
  in_sync: ['Tudo em dia', 'Este dispositivo e o cofre possuem a mesma versão.'],
  local_ahead: ['Há alterações neste dispositivo', 'Nada foi enviado. Seus dados locais continuam preservados.'],
  remote_ahead: ['Há uma versão mais recente no cofre', 'Nada foi baixado ou substituído.'],
  conflict: ['Os dois lados possuem alterações', 'Nenhuma versão foi substituída. A escolha será feita em uma próxima etapa.'],
  unlinked_difference: ['Este dispositivo ainda não está vinculado', 'Os dados deste dispositivo são diferentes do cofre. Nenhuma alteração foi realizada.'],
}

function CloudMigrationContent({
  captures,
  missions,
  activeFocusSession,
  focusSessions,
  dailyPlan,
  user,
  isConfigured,
  isLoading,
}) {
  const [vaultStatus, setVaultStatus] = useState('idle')
  const [existingMetadata, setExistingMetadata] = useState(null)
  const [pendingSnapshot, setPendingSnapshot] = useState(null)
  const [createdResult, setCreatedResult] = useState(null)
  const [downloadedFileName, setDownloadedFileName] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [comparisonResult, setComparisonResult] = useState(null)
  const requestIdRef = useRef(0)
  const currentUserIdRef = useRef(user?.id ?? null)
  const busyRef = useRef(false)
  const isMountedRef = useRef(true)
  const errorRef = useRef(null)
  const successRef = useRef(null)

  const snapshotSummary = useMemo(
    () =>
      pendingSnapshot
        ? createSnapshotSummary(pendingSnapshot)
        : null,
    [pendingSnapshot],
  )

  useEffect(
    () => () => {
      isMountedRef.current = false
      requestIdRef.current += 1
    },
    [],
  )

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.focus()
    }
  }, [errorMessage])

  useEffect(() => {
    if (createdResult) {
      successRef.current?.focus()
    }
  }, [createdResult])

  function beginRequest() {
    if (busyRef.current) {
      return null
    }

    busyRef.current = true
    setIsBusy(true)
    setErrorMessage('')
    setStatusMessage('')

    return {
      id: ++requestIdRef.current,
      userId: currentUserIdRef.current,
    }
  }

  function isCurrentRequest(request) {
    return (
      request.id === requestIdRef.current &&
      request.userId === currentUserIdRef.current &&
      isMountedRef.current
    )
  }

  function finishRequest(request) {
    if (isCurrentRequest(request)) {
      busyRef.current = false
      setIsBusy(false)
    }
  }

  function showExistingVault(row = null) {
    setVaultStatus('existing')
    setExistingMetadata(
      row
        ? {
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            revision: row.revision,
            schemaVersion: row.schemaVersion,
          }
        : null,
    )
    setPendingSnapshot(null)
    setIsConfirming(false)
  }

  async function handleCheckVault() {
    const request = beginRequest()

    if (!request?.userId) {
      return
    }

    setStatusMessage('Verificando seu cofre...')

    try {
      const row = await getUserState(request.userId)

      if (!isCurrentRequest(request)) {
        return
      }

      if (row) {
        showExistingVault(row)
      } else {
        setVaultStatus('empty')
        setStatusMessage(
          'Seu cofre está vazio. Nada foi enviado.',
        )
      }
    } catch (error) {
      if (isCurrentRequest(request)) {
        setErrorMessage(getUserStateErrorMessage(error))
      }
    } finally {
      finishRequest(request)
    }
  }

  async function handleCompare() {
    const request = beginRequest()
    if (!request?.userId) return

    setStatusMessage('Comparando com segurança...')

    try {
      const reference = readSyncState(request.userId)
      const remote = await getUserState(request.userId)
      if (!isCurrentRequest(request)) return
      if (!remote) throw new Error('invalid_response')

      const remoteSnapshot = createCanonicalBackupSnapshot(remote.stateData)
      if (!Number.isInteger(remote.revision) || remote.revision <= 0) {
        throw new Error('invalid_response')
      }

      const comparisonExportedAt = reference?.baseSnapshot.exportedAt || remoteSnapshot.exportedAt
      const localSnapshot = createCanonicalBackupSnapshot(createBackupPayload({
        captures,
        missions,
        activeFocusSession,
        focusSessions,
        dailyPlan,
        exportedAt: comparisonExportedAt,
      }))
      const checkedAt = new Date().toISOString()
      let status

      if (!reference) {
        if (areJsonValuesEqual(localSnapshot, remoteSnapshot)) {
          const nextReference = createSyncReference(request.userId, remote, checkedAt)
          globalThis.localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextReference))
          status = 'in_sync'
        } else {
          status = 'unlinked_difference'
        }
      } else {
        status = classifySyncState(localSnapshot, { ...remote, stateData: remoteSnapshot }, reference)
        if (status === 'in_sync') {
          globalThis.localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({
            ...reference,
            lastCheckedAt: checkedAt,
          }))
        }
      }

      if (!isCurrentRequest(request)) return
      setComparisonResult({
        status,
        local: createSnapshotSummary(localSnapshot),
        remote: createSnapshotSummary(remoteSnapshot),
      })
      setStatusMessage(status === 'in_sync' && !reference
        ? 'Este dispositivo está vinculado e tudo está em dia'
        : '')
    } catch (error) {
      if (isCurrentRequest(request)) setErrorMessage(getUserStateErrorMessage(error))
    } finally {
      finishRequest(request)
    }
  }

  function handlePrepareSnapshot() {
    setPendingSnapshot(null)
    setIsConfirming(false)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const payload = createBackupPayload({
        captures,
        missions,
        activeFocusSession,
        focusSessions,
        dailyPlan,
      })
      const snapshot = createCanonicalBackupSnapshot(payload)

      setPendingSnapshot(snapshot)
      setStatusMessage(
        'Prévia preparada. Ela representa os dados deste momento.',
      )
    } catch {
      setErrorMessage(
        'Não foi possível preparar esta cópia. Tente novamente.',
      )
    }
  }

  async function handleConfirmUpload() {
    const request = beginRequest()

    if (!request?.userId || !pendingSnapshot) {
      return
    }

    const snapshotToUpload = pendingSnapshot
    let fileName

    try {
      fileName = downloadBackupPayload(snapshotToUpload)
    } catch {
      if (isCurrentRequest(request)) {
        setErrorMessage(
          'Não foi possível baixar o backup. Nada foi enviado.',
        )
      }
      finishRequest(request)
      return
    }

    try {
      const currentRow = await getUserState(request.userId)

      if (!isCurrentRequest(request)) {
        return
      }

      if (currentRow) {
        showExistingVault(currentRow)
        setStatusMessage(
          'Seu cofre já possui uma cópia. Nada foi substituído.',
        )
        return
      }

      const createdRow = await createInitialUserState(
        request.userId,
        snapshotToUpload,
      )

      if (!isCurrentRequest(request)) {
        return
      }

      setDownloadedFileName(fileName)
      setCreatedResult({
        ...createdRow,
        summary: createSnapshotSummary(snapshotToUpload),
      })
      setVaultStatus('success')
      setPendingSnapshot(null)
      setIsConfirming(false)
      setStatusMessage('')
    } catch (error) {
      if (!isCurrentRequest(request)) {
        return
      }

      if (error?.code === 'user_state_already_exists') {
        showExistingVault()
        setStatusMessage(
          'Seu cofre já possui uma cópia. Nada foi substituído.',
        )
      } else {
        setErrorMessage(getUserStateErrorMessage(error))
      }
    } finally {
      finishRequest(request)
    }
  }

  return (
    <section
      className="cloud-migration"
      aria-labelledby="cloud-migration-title"
    >
      <h2 id="cloud-migration-title">Cópia segura na nuvem</h2>
      <p>
        Esta é uma cópia inicial. Alterações futuras ainda
        permanecem somente neste dispositivo.
      </p>
      <p>
        Nada será enviado sem confirmação e nenhuma cópia
        existente será substituída.
      </p>

      {(!isConfigured || (!isLoading && !user)) && (
        <p className="cloud-notice">
          Entre na sua conta para verificar e preparar seu cofre.
        </p>
      )}

      {isConfigured && isLoading && (
        <p role="status">Verificando sua conta...</p>
      )}

      {isConfigured && !isLoading && user && vaultStatus === 'idle' && (
        <button
          type="button"
          disabled={isBusy}
          onClick={handleCheckVault}
        >
          Verificar meu cofre
        </button>
      )}

      {vaultStatus === 'existing' && (
        <div className="cloud-result">
          <h3>Seu cofre já possui uma cópia</h3>
          {existingMetadata && (
            <ul>
              <li>
                Criada em:{' '}
                {new Date(existingMetadata.createdAt).toLocaleString('pt-BR')}
              </li>
              <li>
                Última alteração:{' '}
                {new Date(existingMetadata.updatedAt).toLocaleString('pt-BR')}
              </li>
              <li>Revisão: {existingMetadata.revision}</li>
              <li>Versão: {existingMetadata.schemaVersion}</li>
            </ul>
          )}
          <p>
            Nada foi alterado.
          </p>
          <button type="button" disabled={isBusy} onClick={handleCompare}>
            {isBusy ? 'Comparando com segurança...' : 'Comparar este dispositivo com o cofre'}
          </button>
        </div>
      )}

      {comparisonResult && (
        <div className="cloud-result" aria-live="polite">
          <h3>{COMPARISON_COPY[comparisonResult.status][0]}</h3>
          <p>{COMPARISON_COPY[comparisonResult.status][1]}</p>
          <div className="cloud-comparison-summaries">
            <SnapshotSummary title="Neste dispositivo" summary={comparisonResult.local} />
            <SnapshotSummary title="No cofre" summary={comparisonResult.remote} />
          </div>
        </div>
      )}

      {vaultStatus === 'empty' && !pendingSnapshot && (
        <button
          type="button"
          disabled={isBusy}
          onClick={handlePrepareSnapshot}
        >
          Preparar minha cópia inicial
        </button>
      )}

      {pendingSnapshot && snapshotSummary && (
        <div className="cloud-preview">
          <h3>Prévia da cópia inicial</h3>
          <p>
            Preparada em:{' '}
            {new Date(pendingSnapshot.exportedAt).toLocaleString('pt-BR')}
          </p>
          <ul>
            <li>Capturas: {snapshotSummary.captures}</li>
            <li>Missões: {snapshotSummary.missions}</li>
            <li>Missões ativas: {snapshotSummary.activeMissions}</li>
            <li>
              Missões concluídas: {snapshotSummary.completedMissions}
            </li>
            <li>Sessões de foco: {snapshotSummary.focusSessions}</li>
            <li>
              Foco em andamento:{' '}
              {snapshotSummary.hasActiveFocus ? 'Sim' : 'Não'}
            </li>
            <li>Planejamento: {snapshotSummary.dailyPlanDate}</li>
            <li>Versão: {snapshotSummary.schemaVersion}</li>
          </ul>
          <p className="cloud-notice">
            Alterações feitas depois desta prévia não fazem parte
            desta cópia.
          </p>

          {!isConfirming ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setIsConfirming(true)}
            >
              Guardar esta cópia na nuvem
            </button>
          ) : (
            <div className="cloud-confirmation">
              <p>
                Um backup local será baixado primeiro. Exatamente o
                snapshot mostrado será enviado, uma linha existente
                nunca será substituída e mudanças posteriores à
                prévia não fazem parte desta cópia.
              </p>
              <div className="cloud-actions">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleConfirmUpload}
                >
                  Confirmar e guardar
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={isBusy}
                  onClick={() => setIsConfirming(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {createdResult && (
        <div
          className="cloud-result cloud-success"
          ref={successRef}
          tabIndex="-1"
        >
          <h3>Cópia inicial guardada com segurança.</h3>
          <ul>
            <li>Backup baixado: {downloadedFileName}</li>
            <li>
              Criada em:{' '}
              {new Date(createdResult.createdAt).toLocaleString('pt-BR')}
            </li>
            <li>Revisão: {createdResult.revision}</li>
            <li>Versão: {createdResult.schemaVersion}</li>
            <li>Capturas: {createdResult.summary.captures}</li>
            <li>Missões: {createdResult.summary.missions}</li>
            <li>
              Sessões de foco: {createdResult.summary.focusSessions}
            </li>
          </ul>
          <p>
            Seus dados deste navegador continuam intactos. Novas
            alterações ainda não são sincronizadas automaticamente.
          </p>
        </div>
      )}

      {statusMessage && <p role="status">{statusMessage}</p>}
      {isBusy && <p role="status">Aguarde um momento...</p>}
      {errorMessage && (
        <p
          className="cloud-error"
          ref={errorRef}
          role="alert"
          tabIndex="-1"
        >
          {errorMessage}
        </p>
      )}
    </section>
  )
}

function SnapshotSummary({ title, summary }) {
  return (
    <section aria-label={title}>
      <h4>{title}</h4>
      <ul>
        <li>Snapshot criado em: {new Date(summary.createdAt).toLocaleString('pt-BR')}</li>
        <li>Capturas: {summary.captures}</li>
        <li>Missões: {summary.missions}</li>
        <li>Missões ativas: {summary.activeMissions}</li>
        <li>Missões concluídas: {summary.completedMissions}</li>
        <li>Sessões de foco: {summary.focusSessions}</li>
        <li>Foco em andamento: {summary.hasActiveFocus ? 'Sim' : 'Não'}</li>
        <li>Planejamento: {summary.dailyPlanDate}</li>
        <li>Versão do backup: {summary.schemaVersion}</li>
      </ul>
    </section>
  )
}

function CloudMigration(props) {
  const { user, isConfigured, isLoading } = useAuth()

  return (
    <CloudMigrationContent
      key={user?.id ?? 'no-user'}
      {...props}
      user={user}
      isConfigured={isConfigured}
      isLoading={isLoading}
    />
  )
}

export default CloudMigration
