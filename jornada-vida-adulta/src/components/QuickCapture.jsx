import { useState } from 'react'

function QuickCapture({ onCapture }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedText = text.trim()

    if (!normalizedText) {
      return
    }

    onCapture(normalizedText)
    setText('')
  }

  return (
    <section aria-labelledby="quick-capture-title">
      <h2 id="quick-capture-title">
        O que está ocupando espaço na sua cabeça?
      </h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="quick-capture-input">
          Tarefa, ideia ou lembrete
        </label>

        <input
          id="quick-capture-input"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ex.: conferir materiais do Ratisqueiro"
          autoComplete="off"
        />

        <button type="submit" disabled={!text.trim()}>
          Capturar
        </button>
      </form>
    </section>
  )
}

export default QuickCapture
