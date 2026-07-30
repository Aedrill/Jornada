export function orderSteps(steps, missionId) {
  return steps.filter((step) => step.missionId === missionId).sort((a, b) => a.order - b.order)
}

export function nextStep(steps, missionId) {
  return orderSteps(steps, missionId).find((step) => !step.completed) ?? null
}
