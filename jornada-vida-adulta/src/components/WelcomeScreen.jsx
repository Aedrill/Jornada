function WelcomeScreen({ onContinue }) {
  return (
    <main className="welcome-page">
      <section
        className="welcome-card"
        aria-labelledby="welcome-title"
      >
        <span className="welcome-decoration" aria-hidden="true">
          N
        </span>

        <h1 id="welcome-title" className="welcome-brand">
          NORTE
        </h1>

        <p className="welcome-tagline">
          Uma jornada divertida e descomplicada pela vida adulta.
        </p>

        <button
          className="welcome-action"
          type="button"
          onClick={onContinue}
        >
          Começar meu dia
        </button>
      </section>
    </main>
  )
}

export default WelcomeScreen
