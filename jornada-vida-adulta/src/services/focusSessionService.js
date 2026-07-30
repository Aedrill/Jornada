export function getSessionSummary(session) {
  return {
    duration: `${session.actualMinutes} min`,
    variance: session.actualMinutes - session.plannedMinutes,
    interrupted: session.interruptions > 0,
    canContinue: session.outcome === 'paused' && Boolean(session.continuationNote),
  }
}
