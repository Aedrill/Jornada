import { useState } from 'react'

function ThoughtParkingLot({
  thoughts,
  onAddThought,
  onRemoveThought,
}) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedText = text.trim()

    if (!normalizedText) {
      return
    }

    onAddThought(normalizedText)
    setText('')
  }

  return (
    <section aria-labelledby="thought-parking-title">
      <h2 id="thought-parking-title">
        Algo tentou puxar sua atenção?
      </h2>

      <p>
        Estacione o pensamento aqui e volte para a missão.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="parked-thought">
          Pensamento, ideia ou lembrete
        </label>

        <input
          id="parked-thought"
          type="text"
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Ex.: responder a cliente depois"
          autoComplete="off"
        />

        <button type="submit" disabled={!text.trim()}>
          Estacionar pensamento
        </button>
      </form>

      {thoughts.length > 0 && (
        <ul>
          {thoughts.map((thought) => (
            <li key={thought.id}>
              <span>{thought.text}</span>

              <button
                type="button"
                onClick={() =>
                  onRemoveThought(thought.id)
                }
                aria-label={`Remover pensamento: ${thought.text}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ThoughtParkingLot
