import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  createInitialUserState,
  getUserState,
  getUserStateErrorMessage,
} from '../services/userStateService'
import {
  createBackupPayload,
  downloadBackupPayload,
} from '../utils/dataBackup'

function createSnapshotSummary(snapshot) {
  const { data } = snapshot

  return {
    captures: data.captures.length,
    missions: data.missions.length,
    activeMissions: data.missions.filter(
      ({ status }) => status === 'active',
    ).length,
    completedMissions: data.missions.filter(
      ({ status }) => status === 'completed',
    ).length,
    focusSessions: data.focusSessions.length,
    hasActiveFocus: Boolean(data.activeFocusSession),
    dailyPlanDate: data.dailyPlan.dateKey || 'Não informado',
    schemaVersion: snapshot.schemaVersion,
  }
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

  function handlePrepareSnapshot() {
    const snapshot = createBackupPayload({
      captures,
      missions,
      activeFocusSession,
      focusSessions,
      dailyPlan,
    })

    setPendingSnapshot(snapshot)
    setIsConfirming(false)
    setErrorMessage('')
    setStatusMessage(
      'Prévia preparada. Ela representa os dados deste momento.',
    )
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
            Nada foi alterado. A leitura e a sincronização serão
            tratadas em uma etapa futura.
          </p>
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
