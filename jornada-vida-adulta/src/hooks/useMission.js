import { useMemo } from 'react'
import { calculateXp } from '../services/missionService'

export function useMission(missions, completed, dailyLimit) {
  const visible = useMemo(() => missions.slice(0, dailyLimit), [missions, dailyLimit])
  const xp = useMemo(() => calculateXp(missions, completed), [missions, completed])
  const doneToday = visible.filter(({ id }) => completed.includes(id)).length
  return { visible, xp, doneToday, progress: visible.length ? Math.round(doneToday / visible.length * 100) : 0 }
}
