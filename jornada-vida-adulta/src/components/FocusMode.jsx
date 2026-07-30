import { useState } from 'react'
import FocusTimer from './FocusTimer'
import ThoughtParkingLot from './ThoughtParkingLot'

function FocusMode({ mission, plannedMinutes, onExit }) {
  const [continuationNote, setContinuationNote] = useState(
    mission.continuationNote ?? '',
  )
  const [sessionOutcome, setSessionOutcome] = useState('paused')
  const [parkedThoughts, setParkedThoughts] = useState([])

  function handleExit() {
    onExit({
      continuationNote: continuationNote.trim(),
      outcome: sessionOutcome,
      parkedThoughts,
    })
  }

  function handleAddThought(text) {
    setParkedThoughts((currentThoughts) => [
      ...currentThoughts,
      {
        id: crypto.randomUUID(),
        text,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  function handleRemoveThought(thoughtId) {
    setParkedThoughts((currentThoughts) =>
      currentThoughts.filter(
        (thought) => thought.id !== thoughtId,
      ),
    )
  }

  return (
    <main aria-labelledby="focus-mode-title">
      <p>Modo Foco</p>

      <h1 id="focus-mode-title">{mission.title}</h1>

      <section aria-labelledby="focus-action-title">
        <h2 id="focus-action-title">
          Faça apenas isto agora
        </h2>

        <p>{mission.nextAction}</p>
      </section>

      <FocusTimer plannedMinutes={plannedMinutes} />

      <ThoughtParkingLot
        thoughts={parkedThoughts}
        onAddThought={handleAddThought}
        onRemoveThought={handleRemoveThought}
      />

      <fieldset>
        <legend>Como terminou este bloco?</legend>

        <label>
          <input
            type="radio"
            name="session-outcome"
            value="paused"
            checked={sessionOutcome === 'paused'}
            onChange={(event) =>
              setSessionOutcome(event.target.value)
            }
          />
          Pausei por agora
        </label>

        <label>
          <input
            type="radio"
            name="session-outcome"
            value="continuing"
            checked={sessionOutcome === 'continuing'}
            onChange={(event) =>
              setSessionOutcome(event.target.value)
            }
          />
          Vou continuar depois
        </label>

        <label>
          <input
            type="radio"
            name="session-outcome"
            value="completed"
            checked={sessionOutcome === 'completed'}
            onChange={(event) =>
              setSessionOutcome(event.target.value)
            }
          />
          Concluí a missão
        </label>
      </fieldset>

      <section aria-labelledby="continuation-title">
        <h2 id="continuation-title">Onde você parou?</h2>

        <label htmlFor={`continuation-note-${mission.id}`}>
          Registre a primeira ação para quando voltar
        </label>

        <textarea
          id={`continuation-note-${mission.id}`}
          value={continuationNote}
          onChange={(event) =>
            setContinuationNote(event.target.value)
          }
          placeholder="Ex.: continuar a revisão na página 8"
          rows={3}
        />
      </section>

      <button type="button" onClick={handleExit}>
        Salvar e voltar
      </button>
    </main>
  )
}

export default FocusMode
