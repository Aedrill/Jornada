export function createMission(title, options = {}) {
  return {
    id: options.id ?? crypto.randomUUID(),
    title: title.trim(),
    category: options.category ?? 'Pessoal',
    minutes: options.minutes ?? 15,
    xp: options.xp ?? 15,
  }
}

export function calculateXp(missions, completedIds) {
  return missions.filter(({ id }) => completedIds.includes(id)).reduce((sum, mission) => sum + mission.xp, 0)
}
