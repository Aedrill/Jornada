const DAILY_ROLES = [
  {
    value: 'main',
    label: 'Missão principal',
    emptyMessage: 'Nenhuma missão principal definida.',
  },
  {
    value: 'maintenance',
    label: 'Missão de manutenção',
    emptyMessage: 'Nenhuma missão de manutenção definida.',
  },
  {
    value: 'care',
    label: 'Missão de cuidado',
    emptyMessage: 'Nenhuma missão de cuidado definida.',
  },
]

function DailyMissionBoard({
  missions,
  selectedMissionIds,
  onStartFocus,
  onChooseMission,
  onCompleteMission,
  onReopenMission,
  boardRef,
}) {
  function findMissionByRole(role) {
    const selectedMissionId = selectedMissionIds?.[role]

    if (!selectedMissionId) {
      return null
    }

    return (
      missions.find(
        (mission) =>
          mission.id === selectedMissionId,
      ) ?? null
    )
  }

  const dailyMissions = DAILY_ROLES.map((role) =>
    findMissionByRole(role.value),
  )

  const completedMissionCount = dailyMissions.filter(
    (mission) => mission?.status === 'completed',
  ).length

  const selectedMissionCount = dailyMissions.filter(
    Boolean,
  ).length

  const hasSelectedMissions =
    selectedMissionCount > 0

  const allSelectedMissionsCompleted =
    hasSelectedMissions &&
    completedMissionCount === selectedMissionCount

  const progressMaximum = Math.max(
    selectedMissionCount,
    1,
  )

  return (
    <section
      ref={boardRef}
      aria-labelledby="daily-missions-title"
    >
      <h2 id="daily-missions-title">Suas três missões</h2>

      <div aria-live="polite">
        {hasSelectedMissions ? (
          <p>
            {completedMissionCount} de{' '}
            {selectedMissionCount}{' '}
            {selectedMissionCount === 1
              ? 'missão escolhida concluída'
              : 'missões escolhidas concluídas'}
          </p>
        ) : (
          <p>Nenhuma missão escolhida para hoje.</p>
        )}

        <progress
          value={completedMissionCount}
          max={progressMaximum}
          aria-label={
            hasSelectedMissions
              ? `${completedMissionCount} de ${selectedMissionCount} missões escolhidas concluídas`
              : 'Nenhuma missão escolhida para hoje'
          }
        />

        {selectedMissionCount < 3 && (
          <p>
            {3 - selectedMissionCount}{' '}
            {3 - selectedMissionCount === 1
              ? 'espaço disponível'
              : 'espaços disponíveis'}
          </p>
        )}

        {allSelectedMissionsCompleted && (
          <p role="status">
            {selectedMissionCount === 1
              ? 'A missão escolhida foi concluída.'
              : 'Todas as missões escolhidas foram concluídas.'}
          </p>
        )}
      </div>

      <div>
        {DAILY_ROLES.map((role) => {
          const mission = findMissionByRole(role.value)

          const isReady = Boolean(
            mission?.nextAction &&
              mission?.estimatedMinutes &&
              mission?.energyRequired,
          )

          return (
            <article key={role.value}>
              <h3>{role.label}</h3>

              {mission ? (
                <>
                  <p>
                    <strong>{mission.title}</strong>
                  </p>

                  <p>
                    {mission.nextAction ||
                      'Próxima ação ainda não definida.'}
                  </p>

                  {mission.status === 'active' &&
                    mission.continuationNote && (
                      <p>
                        <strong>Ponto de retomada:</strong>{' '}
                        {mission.continuationNote}
                      </p>
                    )}

                  {mission.status === 'completed' ? (
                    <>
                      <p role="status">Missão concluída.</p>

                      <button
                        type="button"
                        onClick={() =>
                          onReopenMission(mission.id)
                        }
                      >
                        Reabrir missão
                      </button>
                    </>
                  ) : (
                    <>
                      {isReady && (
                        <button
                          type="button"
                          onClick={() => onStartFocus(mission)}
                        >
                          Começar por 5 minutos
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onCompleteMission(mission.id)
                        }
                      >
                        Marcar como concluída
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onChooseMission(role.value)
                    }
                  >
                    Trocar missão
                  </button>
                </>
              ) : (
                <>
                  <p>{role.emptyMessage}</p>

                  <button
                    type="button"
                    onClick={() =>
                      onChooseMission(role.value)
                    }
                  >
                    Escolher {role.label.toLowerCase()}
                  </button>
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default DailyMissionBoard
