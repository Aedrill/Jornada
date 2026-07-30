export function prioritizeMissions(missions, checkin) {
  const byEffort = [...missions].sort((a, b) => a.minutes - b.minutes)
  return checkin.energy === 'low' ? byEffort : missions
}

export function fitMissionsToTime(missions, availableMinutes) {
  let used = 0
  return missions.filter((mission) => {
    if (used + mission.minutes > availableMinutes) return false
    used += mission.minutes
    return true
  })
}
