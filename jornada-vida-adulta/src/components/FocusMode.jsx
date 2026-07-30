import FocusTimer from './FocusTimer'

function FocusMode({ mission, plannedMinutes, onExit }) {
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

      <button type="button" onClick={onExit}>
        Voltar sem perder a missão
      </button>
    </main>
  )
}

export default FocusMode
