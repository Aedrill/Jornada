export function getRemainingSeconds(
  session,
  nowMilliseconds = Date.now(),
) {
  const storedSeconds = Math.max(
    Number(session?.remainingSeconds) || 0,
    0,
  )

  if (
    !session?.isTimerRunning ||
    !session?.lastTimerStartedAt
  ) {
    return storedSeconds
  }

  const lastStartedMilliseconds = new Date(
    session.lastTimerStartedAt,
  ).getTime()

  if (!Number.isFinite(lastStartedMilliseconds)) {
    return storedSeconds
  }

  const elapsedSeconds = Math.max(
    Math.floor(
      (nowMilliseconds - lastStartedMilliseconds) / 1000,
    ),
    0,
  )

  return Math.max(storedSeconds - elapsedSeconds, 0)
}
