import { useState } from 'react'

const DURATION_OPTIONS = [5, 15, 30, 60]

const ENERGY_REQUIREMENT_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

const PRIORITY_TYPE_OPTIONS = [
  {
    value: 'main',
    label: 'Principal',
    description: 'Produz avanço real.',
  },
  {
    value: 'maintenance',
    label: 'Manutenção',
    description: 'Evita problemas ou acúmulos.',
  },
  {
    value: 'care',
    label: 'Cuidado',
    description: 'Protege sua saúde e energia.',
  },
]

const PRIORITY_TYPE_LABELS = {
  main: 'Principal',
  maintenance: 'Manutenção',
  care: 'Cuidado',
}

function MissionCard({
  mission,
  onSaveNextAction,
  onSaveEstimatedMinutes,
  onSaveEnergyRequired,
  onSavePriorityType,
  onDeleteMission,
  onStartFocus,
  onSelectForToday,
  onRemoveFromToday,
  isSelectedForToday,
}) {
  const [nextActionDraft, setNextActionDraft] = useState(
    mission.nextAction,
  )
  const [isConfirmingDelete, setIsConfirmingDelete] =
    useState(false)

  const canStartFocus = Boolean(
    mission.status === 'active' &&
      mission.nextAction &&
      mission.estimatedMinutes &&
      mission.energyRequired,
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

      {mission.priorityType && (
        <p>
          <strong>Papel:</strong>{' '}
          {PRIORITY_TYPE_LABELS[mission.priorityType]}
        </p>
      )}

      {mission.status === 'completed' && (
        <p role="status">Missão concluída.</p>
      )}

      {mission.nextAction ? (
        <p>
          <strong>Próxima ação:</strong> {mission.nextAction}
        </p>
      ) : (
        <p>Próxima ação ainda não definida.</p>
      )}

      {mission.continuationNote && (
        <p>
          <strong>Para retomar:</strong>{' '}
          {mission.continuationNote}
        </p>
      )}

      {mission.status === 'active' && (
        <>
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
                  onClick={() =>
                    onSaveEstimatedMinutes(mission.id, minutes)
                  }
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Quanta energia esta missão exige?</legend>
            <div>
              {ENERGY_REQUIREMENT_OPTIONS.map((option) => {
                const isSelected =
                  mission.energyRequired === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      onSaveEnergyRequired(
                        mission.id,
                        option.value,
                      )
                    }
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend>Qual é o papel desta missão?</legend>

            <div>
              {PRIORITY_TYPE_OPTIONS.map((option) => {
                const isSelected =
                  mission.priorityType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      onSavePriorityType(
                        mission.id,
                        option.value,
                      )
                    }
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        </>
      )}

      {mission.status === 'active' &&
        mission.priorityType && (
          <section aria-label="Planejamento diário">
            {isSelectedForToday ? (
              <button
                type="button"
                onClick={() =>
                  onRemoveFromToday(mission.id)
                }
              >
                Remover de hoje
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onSelectForToday(mission)
                }
              >
                Escolher para hoje
              </button>
            )}
          </section>
        )}

      {canStartFocus && (
        <section aria-label="Iniciar missão">
          <button
            type="button"
            onClick={() => onStartFocus(mission)}
          >
            Começar por 5 minutos
          </button>
        </section>
      )}

      <section aria-label="Ações da missão">
        {!isConfirmingDelete ? (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
          >
            Excluir missão
          </button>
        ) : (
          <div role="alert">
            <p>Excluir esta missão permanentemente?</p>

            <button
              type="button"
              onClick={() => onDeleteMission(mission.id)}
            >
              Sim, excluir
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </section>
    </article>
  )
}

export default MissionCard
