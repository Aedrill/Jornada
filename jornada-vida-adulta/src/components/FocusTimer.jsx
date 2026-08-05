import { useEffect, useState } from 'react'
import { getRemainingSeconds } from '../utils/focusTimer'

function FocusTimer({ session, onUpdateSession }) {
  const totalSeconds = session.plannedMinutes * 60

  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getRemainingSeconds(session),
  )

  useEffect(() => {
    function updateDisplayedTime() {
      const currentRemainingSeconds =
        getRemainingSeconds(session)

      setRemainingSeconds(currentRemainingSeconds)

      if (
        session.isTimerRunning &&
        currentRemainingSeconds === 0
      ) {
        onUpdateSession((currentSession) => ({
          ...currentSession,
          remainingSeconds: 0,
          isTimerRunning: false,
          lastTimerStartedAt: null,
        }))
      }
    }

    updateDisplayedTime()

    if (
      !session.isTimerRunning ||
      getRemainingSeconds(session) === 0
    ) {
      return undefined
    }

    const intervalId = window.setInterval(
      updateDisplayedTime,
      1000,
    )

    return () => {
      window.clearInterval(intervalId)
    }
  }, [onUpdateSession, session])

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

    if (session.isTimerRunning) {
      const currentRemainingSeconds =
        getRemainingSeconds(session)

      setRemainingSeconds(currentRemainingSeconds)
      onUpdateSession((currentSession) => ({
        ...currentSession,
        remainingSeconds: currentRemainingSeconds,
        isTimerRunning: false,
        lastTimerStartedAt: null,
      }))
      return
    }

    onUpdateSession((currentSession) => ({
      ...currentSession,
      isTimerRunning: true,
      lastTimerStartedAt: new Date().toISOString(),
    }))
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
          {session.isTimerRunning ? 'Pausar' : 'Continuar'}
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
