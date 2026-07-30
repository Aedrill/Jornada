import { useState } from 'react'
import AvailableTimeCheckIn from '../components/AvailableTimeCheckIn'
import EnergyCheckIn from '../components/EnergyCheckIn'
import MissionCard from '../components/MissionCard'
import QuickCapture from '../components/QuickCapture'

const ENERGY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const INITIAL_MISSIONS = [
  {
    id: 'mission-ratisqueiro',
    sourceCaptureId: null,
    title: 'Finalizar o PDF do Ratisqueiro',
    nextAction: 'Abrir o PDF e localizar a página de materiais.',
    status: 'active',
    priorityType: null,
    estimatedMinutes: null,
    energyRequired: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  },
]

function NowPage() {
  const [energy, setEnergy] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(null)
  const [isCheckInConfirmed, setIsCheckInConfirmed] = useState(false)
  const [captures, setCaptures] = useState([])
  const [missions, setMissions] = useState(INITIAL_MISSIONS)

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

          <QuickCapture onCapture={handleCapture} />

          {captures.length > 0 && (
            <section aria-labelledby="captures-title">
              <h2 id="captures-title">Caixa de entrada</h2>

              <ul>
                {captures.map((capture) => (
                  <li key={capture.id}>
                    <span>{capture.text}</span>
                    <button
                      type="button"
                      onClick={() => handleConvertCaptureToMission(capture.id)}
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
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default NowPage
