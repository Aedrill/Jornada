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

  return (
    <section
      ref={boardRef}
      aria-labelledby="daily-missions-title"
    >
      <h2 id="daily-missions-title">Suas três missões</h2>

      <div aria-live="polite">
        <p>
          {completedMissionCount} de 3 missões concluídas
        </p>

        <progress
          value={completedMissionCount}
          max="3"
          aria-label={`${completedMissionCount} de 3 missões concluídas`}
        />

        {selectedMissionCount < 3 && (
          <p>
            {3 - selectedMissionCount}{' '}
            {3 - selectedMissionCount === 1
              ? 'espaço disponível'
              : 'espaços disponíveis'}
          </p>
        )}

        {completedMissionCount === 3 && (
          <p role="status">
            As três missões do dia foram concluídas.
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

                  {mission.status === 'completed' ? (
                    <p role="status">Missão concluída.</p>
                  ) : (
                    isReady && (
                      <button
                        type="button"
                        onClick={() => onStartFocus(mission)}
                      >
                        Começar por 5 minutos
                      </button>
                    )
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
