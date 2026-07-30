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
  onStartFocus,
}) {
  function findMissionByRole(role) {
    return missions
      .filter(
        (mission) =>
          mission.status === 'active' &&
          mission.priorityType === role,
      )
      .sort(
        (firstMission, secondMission) =>
          new Date(firstMission.createdAt).getTime() -
          new Date(secondMission.createdAt).getTime(),
      )[0] ?? null
  }

  return (
    <section aria-labelledby="daily-missions-title">
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

                  {isReady && (
                    <button
                      type="button"
                      onClick={() => onStartFocus(mission)}
                    >
                      Começar por 5 minutos
                    </button>
                  )}
                </>
              ) : (
                <p>{role.emptyMessage}</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default DailyMissionBoard
