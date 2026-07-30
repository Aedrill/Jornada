import { useState } from 'react'
import AvailableTimeCheckIn from '../components/AvailableTimeCheckIn'
import EnergyCheckIn from '../components/EnergyCheckIn'
import FocusHistory from '../components/FocusHistory'
import FocusMode from '../components/FocusMode'
import MissionCard from '../components/MissionCard'
import QuickCapture from '../components/QuickCapture'
import RescueMode from '../components/RescueMode'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { recommendMission } from '../utils/missionPrioritizer'

const ENERGY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

function NowPage() {
  const [energy, setEnergy] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(null)
  const [isCheckInConfirmed, setIsCheckInConfirmed] = useState(false)
  const [captures, setCaptures] = useLocalStorageState(
    'jornada:v2:captures',
    [],
  )
  const [missions, setMissions] = useLocalStorageState(
    'jornada:v2:missions',
    [],
  )
  const [activeFocusSession, setActiveFocusSession] =
    useState(null)
  const [rescueMissionId, setRescueMissionId] =
    useState(null)
  const [focusSessions, setFocusSessions] =
    useLocalStorageState(
      'jornada:v2:focus-sessions',
      [],
    )

  const activeFocusMission = activeFocusSession
    ? missions.find(
        (mission) =>
          mission.id === activeFocusSession.missionId,
      )
    : null

  const rescueMission = rescueMissionId
    ? missions.find(
        (mission) => mission.id === rescueMissionId,
      )
    : null

  const recommendedMission = recommendMission(
    missions,
    availableMinutes,
    energy,
  )

  const canConfirmCheckIn =
    Boolean(energy) && availableMinutes !== null

  function handleEnergyChange(value) {
    setEnergy(value)
    setIsCheckInConfirmed(false)
  }

  function handleAvailableTimeChange(value) {
    setAvailableMinutes(value)
    setIsCheckInConfirmed(false)
  }

  function handleConfirmCheckIn() {
    if (!canConfirmCheckIn) {
      return
    }

    setIsCheckInConfirmed(true)
  }

  function handleCapture(text) {
    const newCapture = {
      id: crypto.randomUUID(),
      text,
      status: 'inbox',
      createdAt: new Date().toISOString(),
    }

    setCaptures((currentCaptures) => [
      newCapture,
      ...currentCaptures,
    ])
  }

  function handleConvertCaptureToMission(captureId) {
    const capture = captures.find(
      (currentCapture) => currentCapture.id === captureId,
    )

    if (!capture) {
      return
    }

    const newMission = {
      id: crypto.randomUUID(),
      sourceCaptureId: capture.id,
      title: capture.text,
      nextAction: '',
      status: 'active',
      priorityType: null,
      estimatedMinutes: null,
      energyRequired: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    setMissions((currentMissions) => [
      newMission,
      ...currentMissions,
    ])
    setCaptures((currentCaptures) =>
      currentCaptures.filter(
        (currentCapture) => currentCapture.id !== captureId,
      ),
    )
  }

  function handleSaveNextAction(missionId, nextAction) {
    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              nextAction,
              updatedAt: new Date().toISOString(),
            }
          : mission,
      ),
    )
  }

  function handleSaveEstimatedMinutes(missionId, estimatedMinutes) {
    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              estimatedMinutes,
              updatedAt: new Date().toISOString(),
            }
          : mission,
      ),
    )
  }

  function handleSaveEnergyRequired(
    missionId,
    energyRequired,
  ) {
    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              energyRequired,
              updatedAt: new Date().toISOString(),
            }
          : mission,
      ),
    )
  }

  function handleStartFocus(mission) {
    setActiveFocusSession({
      id: crypto.randomUUID(),
      missionId: mission.id,
      plannedMinutes: 5,
      startedAt: new Date().toISOString(),
    })
  }

  function handleExitFocus({
    continuationNote,
    outcome,
  }) {
    if (!activeFocusSession) {
      return
    }

    const endedAt = new Date().toISOString()
    const startedAtMilliseconds = new Date(
      activeFocusSession.startedAt,
    ).getTime()
    const endedAtMilliseconds = new Date(endedAt).getTime()
    const actualSeconds = Math.max(
      0,
      Math.round(
        (endedAtMilliseconds - startedAtMilliseconds) / 1000,
      ),
    )
    const actualMinutes = Number(
      (actualSeconds / 60).toFixed(1),
    )
    const completedMission = outcome === 'completed'

    setFocusSessions((currentSessions) => [
      {
        ...activeFocusSession,
        outcome,
        continuationNote,
        endedAt,
        actualSeconds,
        actualMinutes,
      },
      ...currentSessions,
    ])

    setMissions((currentMissions) =>
      currentMissions.map((mission) => {
        if (mission.id !== activeFocusSession.missionId) {
          return mission
        }

        return {
          ...mission,
          continuationNote: completedMission
            ? ''
            : continuationNote,
          status: completedMission ? 'completed' : 'active',
          completedAt: completedMission ? endedAt : null,
          updatedAt: endedAt,
        }
      }),
    )

    setActiveFocusSession(null)
  }

  function handleStartRescueFocus(rescueReason) {
    if (!rescueMission) {
      return
    }

    setActiveFocusSession({
      id: crypto.randomUUID(),
      missionId: rescueMission.id,
      plannedMinutes: 2,
      startedAt: new Date().toISOString(),
      source: 'rescue',
      rescueReason,
    })

    setRescueMissionId(null)
  }

  if (rescueMission) {
    return (
      <main className="now-checkin-page">
        <RescueMode
          mission={rescueMission}
          onClose={() => setRescueMissionId(null)}
          onStartReducedFocus={handleStartRescueFocus}
        />
      </main>
    )
  }

  if (activeFocusSession && activeFocusMission) {
    return (
      <FocusMode
        mission={activeFocusMission}
        plannedMinutes={activeFocusSession.plannedMinutes}
        onExit={handleExitFocus}
      />
    )
  }

  return (
    <main className="now-checkin-page">
      <h1>Agora</h1>

      <EnergyCheckIn
        value={energy}
        onChange={handleEnergyChange}
      />

      <AvailableTimeCheckIn
        value={availableMinutes}
        onChange={handleAvailableTimeChange}
      />

      <button
        type="button"
        disabled={!canConfirmCheckIn}
        onClick={handleConfirmCheckIn}
      >
        Preparar minhas missões
      </button>

      {isCheckInConfirmed && (
        <>
          <section aria-live="polite">
            <h2>Check-in concluído</h2>

            <p>Energia: {ENERGY_LABELS[energy]}</p>
            <p>Tempo disponível: {availableMinutes} minutos</p>
          </section>

          <section aria-labelledby="recommendation-title">
            <h2 id="recommendation-title">Missão recomendada</h2>

            {recommendedMission ? (
              <article>
                <h3>{recommendedMission.title}</h3>

                <p>
                  <strong>Próxima ação:</strong>{' '}
                  {recommendedMission.nextAction}
                </p>

                <p>
                  Tempo estimado: {recommendedMission.estimatedMinutes}{' '}
                  minutos
                </p>

                <p>
                  Recomendada porque cabe nos seus {availableMinutes}{' '}
                  minutos e respeita sua energia atual.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleStartFocus(recommendedMission)
                  }
                >
                  Começar por 5 minutos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRescueMissionId(recommendedMission.id)
                  }
                >
                  Não consigo começar
                </button>
              </article>
            ) : (
              <p>
                Ainda não há uma missão compatível com seu tempo e
                energia.
              </p>
            )}
          </section>

          <QuickCapture onCapture={handleCapture} />
        </>
      )}

      {captures.length > 0 && (
        <section aria-labelledby="captures-title">
          <h2 id="captures-title">Caixa de entrada</h2>

          <ul>
            {captures.map((capture) => (
              <li key={capture.id}>
                <span>{capture.text}</span>
                <button
                  type="button"
                  onClick={() =>
                    handleConvertCaptureToMission(capture.id)
                  }
                >
                  Transformar em missão
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {missions.length > 0 && (
        <section aria-labelledby="missions-title">
          <h2 id="missions-title">Missões</h2>

          <ul>
            {missions.map((mission) => (
              <li key={mission.id}>
                <MissionCard
                  mission={mission}
                  onSaveNextAction={handleSaveNextAction}
                  onSaveEstimatedMinutes={handleSaveEstimatedMinutes}
                  onSaveEnergyRequired={handleSaveEnergyRequired}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <FocusHistory
        sessions={focusSessions}
        missions={missions}
      />
    </main>
  )
}

export default NowPage
