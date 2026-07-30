import { useEffect, useState } from 'react'

export function useFocusTimer(initialMinutes, onComplete) {
  const [seconds, setSeconds] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        setRunning(false)
        onComplete()
        return 0
      }
      return value - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [running, onComplete])

  const reset = (minutes = initialMinutes) => {
    setRunning(false)
    setSeconds(minutes * 60)
  }

  return { seconds, running, toggle: () => setRunning((value) => !value), reset }
}
