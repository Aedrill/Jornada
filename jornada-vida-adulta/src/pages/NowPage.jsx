import {
  useEffect,
  useRef,
  useState,
} from 'react'
import AvailableTimeCheckIn from '../components/AvailableTimeCheckIn'
import DailyMissionBoard from '../components/DailyMissionBoard'
import EnergyCheckIn from '../components/EnergyCheckIn'
import FocusHistory from '../components/FocusHistory'
import FocusMode from '../components/FocusMode'
import MissionCard from '../components/MissionCard'
import QuickCapture from '../components/QuickCapture'
import RescueMode from '../components/RescueMode'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { getLocalDateKey } from '../utils/dateKey'
import { recommendMission } from '../utils/missionPrioritizer'

const ENERGY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const EMPTY_DAILY_SELECTIONS = {
  main: null,
  maintenance: null,
  care: null,
}

const DAILY_ROLE_LABELS = {
  main: 'Principal',
  maintenance: 'Manutenção',
  care: 'Cuidado',
}

function createDailyPlan(dateKey) {
  return {
    dateKey,
    selections: {
      ...EMPTY_DAILY_SELECTIONS,
    },
  }
}

function removeMissionFromSelections(
  selections,
  missionId,
) {
  return Object.fromEntries(
    Object.entries({
      ...EMPTY_DAILY_SELECTIONS,
      ...selections,
    }).map(([role, selectedMissionId]) => [
      role,
      selectedMissionId === missionId
        ? null
        : selectedMissionId,
    ]),
  )
}

function NowPage() {
  const todayKey = getLocalDateKey()

  const [energy, setEnergy] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(null)
  const [isCheckInConfirmed, setIsCheckInConfirmed] = useState(false)
  const [isMissionListOpen, setIsMissionListOpen] =
    useState(false)
  const [
    missionListRoleFilter,
    setMissionListRoleFilter,
  ] = useState(null)
  const missionListSectionRef = useRef(null)
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
  const [dailyPlan, setDailyPlan] =
    useLocalStorageState(
      'jornada:v2:daily-plan',
      createDailyPlan(todayKey),
    )

  useEffect(() => {
    setDailyPlan((currentPlan) => {
      if (
        currentPlan?.dateKey === todayKey &&
        currentPlan?.selections
      ) {
        return currentPlan
      }

      return createDailyPlan(todayKey)
    })
  }, [setDailyPlan, todayKey])

  useEffect(() => {
    if (
      !isMissionListOpen ||
      !missionListRoleFilter
    ) {
      return
    }

    missionListSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [
    isMissionListOpen,
    missionListRoleFilter,
  ])

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

  const visibleMissions = missionListRoleFilter
    ? missions.filter(
        (mission) =>
          mission.status === 'active' &&
          mission.priorityType ===
            missionListRoleFilter,
      )
    : missions

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

  function handleConvertParkedThoughtToCapture(
    sessionId,
    thoughtId,
  ) {
    const session = focusSessions.find(
      (currentSession) =>
        currentSession.id === sessionId,
    )

    const thought = session?.parkedThoughts?.find(
      (currentThought) =>
        currentThought.id === thoughtId,
    )

    if (!thought || thought.captureId) {
      return
    }

    const captureId = crypto.randomUUID()
    const convertedAt = new Date().toISOString()

    const newCapture = {
      id: captureId,
      text: thought.text,
      status: 'inbox',
      createdAt: convertedAt,
      source: {
        type: 'parked-thought',
        sessionId,
        thoughtId,
      },
    }

    setCaptures((currentCaptures) => [
      newCapture,
      ...currentCaptures,
    ])

    setFocusSessions((currentSessions) =>
      currentSessions.map((currentSession) => {
        if (currentSession.id !== sessionId) {
          return currentSession
        }

        return {
          ...currentSession,
          parkedThoughts:
            currentSession.parkedThoughts?.map(
              (currentThought) =>
                currentThought.id === thoughtId
                  ? {
                      ...currentThought,
                      captureId,
                      convertedToCaptureAt:
                        convertedAt,
                    }
                  : currentThought,
            ) ?? [],
        }
      }),
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

  function handleSavePriorityType(
    missionId,
    priorityType,
  ) {
    const currentMission = missions.find(
      (mission) => mission.id === missionId,
    )

    if (!currentMission) {
      return
    }

    const roleChanged =
      currentMission.priorityType !== priorityType

    setMissions((currentMissions) =>
      currentMissions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              priorityType,
              updatedAt: new Date().toISOString(),
            }
        : mission,
      ),
    )

    if (!roleChanged) {
      return
    }

    setDailyPlan((currentPlan) => ({
      dateKey: todayKey,
      selections: removeMissionFromSelections(
        currentPlan?.selections,
        missionId,
      ),
    }))
  }

  function handleSelectMissionForToday(mission) {
    const validRoles = [
      'main',
      'maintenance',
      'care',
    ]

    if (
      mission.status !== 'active' ||
      !validRoles.includes(mission.priorityType)
    ) {
      return
    }

    setDailyPlan((currentPlan) => {
      const currentSelections =
        currentPlan?.dateKey === todayKey
          ? {
              ...EMPTY_DAILY_SELECTIONS,
              ...currentPlan.selections,
            }
          : {
              ...EMPTY_DAILY_SELECTIONS,
            }

      return {
        dateKey: todayKey,
        selections: {
          ...currentSelections,
          [mission.priorityType]: mission.id,
        },
      }
    })
  }

  function handleRemoveMissionFromToday(missionId) {
    setDailyPlan((currentPlan) => ({
      dateKey: todayKey,
      selections: removeMissionFromSelections(
        currentPlan?.selections,
        missionId,
      ),
    }))
  }

  function handleOpenMissionListForRole(role) {
    setMissionListRoleFilter(role)
    setIsMissionListOpen(true)
  }

  function handleDeleteMission(missionId) {
    setMissions((currentMissions) =>
      currentMissions.filter(
        (mission) => mission.id !== missionId,
      ),
    )

    setDailyPlan((currentPlan) => ({
      ...currentPlan,
      selections: Object.fromEntries(
        Object.entries(
          currentPlan.selections ??
            EMPTY_DAILY_SELECTIONS,
        ).map(([role, selectedMissionId]) => [
          role,
          selectedMissionId === missionId
            ? null
            : selectedMissionId,
        ]),
      ),
    }))
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
    parkedThoughts,
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
        parkedThoughts,
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

          <DailyMissionBoard
            missions={missions}
            selectedMissionIds={
              dailyPlan?.selections ??
              EMPTY_DAILY_SELECTIONS
            }
            onStartFocus={handleStartFocus}
            onChooseMission={
              handleOpenMissionListForRole
            }
          />

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
        <section
          ref={missionListSectionRef}
          aria-labelledby="missions-title"
        >
          <button
            type="button"
            aria-expanded={isMissionListOpen}
            aria-controls="mission-list-content"
            onClick={() => {
              setIsMissionListOpen(
                (currentValue) => {
                  const nextValue = !currentValue

                  if (!nextValue) {
                    setMissionListRoleFilter(null)
                  }

                  return nextValue
                },
              )
            }}
          >
            {isMissionListOpen
              ? 'Ocultar todas as missões'
              : `Ver todas as missões (${missions.length})`}
          </button>

          {isMissionListOpen && (
            <div id="mission-list-content">
              <h2 id="missions-title">Todas as missões</h2>

              {missionListRoleFilter && (
                <div role="status">
                  <p>
                    Mostrando missões de{' '}
                    <strong>
                      {
                        DAILY_ROLE_LABELS[
                          missionListRoleFilter
                        ]
                      }
                    </strong>
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setMissionListRoleFilter(null)
                    }
                  >
                    Mostrar todas
                  </button>
                </div>
              )}

              {visibleMissions.length === 0 && (
                <p>
                  Nenhuma missão disponível para este papel.
                </p>
              )}

              <ul>
                {visibleMissions.map((mission) => (
                  <li key={mission.id}>
                    <MissionCard
                      mission={mission}
                      onSaveNextAction={
                        handleSaveNextAction
                      }
                      onSaveEstimatedMinutes={
                        handleSaveEstimatedMinutes
                      }
                      onSaveEnergyRequired={
                        handleSaveEnergyRequired
                      }
                      onSavePriorityType={
                        handleSavePriorityType
                      }
                      onDeleteMission={
                        handleDeleteMission
                      }
                      onStartFocus={handleStartFocus}
                      onSelectForToday={
                        handleSelectMissionForToday
                      }
                      onRemoveFromToday={
                        handleRemoveMissionFromToday
                      }
                      isSelectedForToday={Boolean(
                        mission.priorityType &&
                          dailyPlan?.selections?.[
                            mission.priorityType
                          ] === mission.id,
                      )}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <FocusHistory
        sessions={focusSessions}
        missions={missions}
        onConvertThoughtToCapture={
          handleConvertParkedThoughtToCapture
        }
      />
    </main>
  )
}

export default NowPage
