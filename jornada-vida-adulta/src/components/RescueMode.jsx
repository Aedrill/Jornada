import { useState } from 'react'

const RESCUE_OPTIONS = [
  {
    value: 'too-big',
    label: 'A tarefa está grande demais',
    response:
      'Vamos reduzir a missão. Faça somente a primeira ação por dois minutos.',
  },
  {
    value: 'unclear',
    label: 'Não sei por onde começar',
    response:
      'Ignore o resultado final. Comece apenas pela próxima ação exibida.',
  },
  {
    value: 'tired',
    label: 'Estou cansada',
    response:
      'Sua energia merece ser respeitada. Faça uma versão menor ou escolha uma missão mais leve.',
  },
  {
    value: 'anxious',
    label: 'Estou ansiosa ou frustrada',
    response:
      'Pause por um minuto. Respire, afaste-se da cobrança e retorne apenas à menor ação possível.',
  },
  {
    value: 'missing',
    label: 'Está faltando alguma coisa',
    response:
      'Identifique somente o que está faltando. Conseguir esse item será a nova próxima ação.',
  },
  {
    value: 'distracted',
    label: 'Estou distraída',
    response:
      'Registre a distração para depois e deixe visível apenas esta missão.',
  },
  {
    value: 'unknown',
    label: 'Não sei explicar',
    response:
      'Tudo bem não saber. Vamos tentar somente dois minutos e observar o que acontece.',
  },
]

function RescueMode({
  mission,
  onClose,
  onStartReducedFocus,
}) {
  const [selectedReason, setSelectedReason] = useState('')

  const selectedOption = RESCUE_OPTIONS.find(
    (option) => option.value === selectedReason,
  )

  return (
    <section aria-labelledby="rescue-title">
      <h2 id="rescue-title">Vamos remover o bloqueio</h2>

      <p>
        Você não precisa concluir <strong>{mission.title}</strong>{' '}
        agora. Precisamos apenas encontrar uma entrada possível.
      </p>

      <fieldset>
        <legend>O que está dificultando o início?</legend>

        {RESCUE_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="rescue-reason"
              value={option.value}
              checked={selectedReason === option.value}
              onChange={(event) =>
                setSelectedReason(event.target.value)
              }
            />

            {option.label}
          </label>
        ))}
      </fieldset>

      {selectedOption && (
        <div role="status">
          <p>{selectedOption.response}</p>

          <p>
            <strong>Sua próxima ação:</strong>{' '}
            {mission.nextAction}
          </p>

          <button
            type="button"
            onClick={() =>
              onStartReducedFocus(selectedReason)
            }
          >
            Começar por 2 minutos
          </button>
        </div>
      )}

      <button type="button" onClick={onClose}>
        Voltar para a missão
      </button>
    </section>
  )
}

export default RescueMode
