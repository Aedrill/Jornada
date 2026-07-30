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

  return (
    <section
      ref={boardRef}
      aria-labelledby="daily-missions-title"
    >
      <h2 id="daily-missions-title">Suas três missões</h2>

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
