import { useState } from 'react'
import FocusTimer from './FocusTimer'

function FocusMode({ mission, plannedMinutes, onExit }) {
  const [continuationNote, setContinuationNote] = useState(
    mission.continuationNote ?? '',
  )

  function handleExit() {
    onExit(continuationNote.trim())
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
