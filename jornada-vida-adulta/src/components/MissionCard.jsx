import { useState } from 'react'

const DURATION_OPTIONS = [5, 15, 30, 60]

function MissionCard({ mission, onSaveNextAction, onSaveEstimatedMinutes }) {
  const [nextActionDraft, setNextActionDraft] = useState(
    mission.nextAction,
  )

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedNextAction = nextActionDraft.trim()

    if (!normalizedNextAction) {
      return
    }

    onSaveNextAction(mission.id, normalizedNextAction)
  }

  return (
    <article>
      <h3>{mission.title}</h3>

      {mission.nextAction ? (
        <p>
          <strong>Próxima ação:</strong> {mission.nextAction}
        </p>
      ) : (
        <p>Próxima ação ainda não definida.</p>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor={`next-action-${mission.id}`}>
          Qual é a menor ação para começar?
        </label>

        <input
          id={`next-action-${mission.id}`}
          type="text"
          value={nextActionDraft}
          onChange={(event) =>
            setNextActionDraft(event.target.value)
          }
          placeholder="Ex.: abrir o arquivo"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={!nextActionDraft.trim()}
        >
          Salvar próxima ação
        </button>
      </form>

      <fieldset>
        <legend>Quanto tempo esta missão deve levar?</legend>
        <div>
          {DURATION_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={mission.estimatedMinutes === minutes}
              onClick={() => onSaveEstimatedMinutes(mission.id, minutes)}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </fieldset>
    </article>
  )
}

export default MissionCard
