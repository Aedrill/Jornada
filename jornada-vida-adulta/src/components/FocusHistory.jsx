const OUTCOME_LABELS = {
  paused: 'Pausou por agora',
  continuing: 'Continuará depois',
  completed: 'Concluiu a missão',
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return 'Tempo não registrado'
  }

  if (seconds < 60) {
    return `${seconds} segundos`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} min`
  }

  return `${minutes} min ${remainingSeconds} s`
}

function FocusHistory({ sessions, missions }) {
  const recentSessions = sessions.slice(0, 5)

  if (recentSessions.length === 0) {
    return null
  }

  function getMissionTitle(missionId) {
    const mission = missions.find(
      (currentMission) =>
        currentMission.id === missionId,
    )

    return mission?.title ?? 'Missão não encontrada'
  }

  return (
    <section aria-labelledby="focus-history-title">
      <h2 id="focus-history-title">Sessões recentes</h2>

      <ul>
        {recentSessions.map((session) => (
          <li key={session.id}>
            <article>
              <h3>{getMissionTitle(session.missionId)}</h3>

              <p>Planejado: {session.plannedMinutes} min</p>

              <p>
                Tempo real: {formatDuration(session.actualSeconds)}
              </p>

              <p>
                Resultado:{' '}
                {OUTCOME_LABELS[session.outcome] ??
                  'Não informado'}
              </p>

              {session.source === 'rescue' && (
                <p>Iniciada pelo Modo Resgate.</p>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FocusHistory
