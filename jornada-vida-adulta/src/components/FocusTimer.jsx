import { useEffect, useState } from 'react'

function FocusTimer({ plannedMinutes }) {
  const totalSeconds = plannedMinutes * 60

  const [remainingSeconds, setRemainingSeconds] = useState(
    () => totalSeconds,
  )
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning || remainingSeconds === 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) =>
        Math.max(currentSeconds - 1, 0),
      )
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isRunning, remainingSeconds])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  const formattedTime = `${String(minutes).padStart(
    2,
    '0',
  )}:${String(seconds).padStart(2, '0')}`

  const isFinished = remainingSeconds === 0

  function handleToggleTimer() {
    if (isFinished) {
      return
    }

    setIsRunning((currentValue) => !currentValue)
  }

  return (
    <section aria-labelledby="focus-timer-title">
      <h2 id="focus-timer-title">Tempo de foco</h2>

      <p
        role="timer"
        aria-label={`Tempo restante: ${minutes} minutos e ${seconds} segundos`}
      >
        {formattedTime}
      </p>

      <progress
        value={remainingSeconds}
        max={totalSeconds}
        aria-label="Tempo restante da sessão"
      />

      {!isFinished && (
        <button type="button" onClick={handleToggleTimer}>
          {isRunning ? 'Pausar' : 'Continuar'}
        </button>
      )}

      {isFinished && (
        <p role="status">
          Bloco concluído. Você começou — isso já conta.
        </p>
      )}
    </section>
  )
}

export default FocusTimer
