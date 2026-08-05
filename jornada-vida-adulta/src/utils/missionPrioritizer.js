const ENERGY_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
}

export function isMissionReady(mission) {
  return Boolean(
    mission.nextAction &&
      mission.estimatedMinutes &&
      mission.energyRequired &&
      mission.status === 'active',
  )
}

export function isMissionCompatible(
  mission,
  availableMinutes,
  currentEnergy,
) {
  if (!isMissionReady(mission)) {
    return false
  }

  const missionEnergyLevel = ENERGY_LEVELS[mission.energyRequired]
  const currentEnergyLevel = ENERGY_LEVELS[currentEnergy]

  if (!missionEnergyLevel || !currentEnergyLevel) {
    return false
  }

  return (
    mission.estimatedMinutes <= availableMinutes &&
    missionEnergyLevel <= currentEnergyLevel
  )
}

export function recommendMission(
  missions,
  availableMinutes,
  currentEnergy,
) {
  const compatibleMissions = missions
    .filter((mission) =>
      isMissionCompatible(
        mission,
        availableMinutes,
        currentEnergy,
      ),
    )
    .sort((firstMission, secondMission) => {
      const durationDifference =
        firstMission.estimatedMinutes -
        secondMission.estimatedMinutes

      if (durationDifference !== 0) {
        return durationDifference
      }

      return (
        new Date(firstMission.createdAt).getTime() -
        new Date(secondMission.createdAt).getTime()
      )
    })

  return compatibleMissions[0] ?? null
}
