import { useState } from 'react'
import AvailableTimeCheckIn from '../components/AvailableTimeCheckIn'
import EnergyCheckIn from '../components/EnergyCheckIn'

const ENERGY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

function NowPage() {
  const [energy, setEnergy] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(null)
  const [isCheckInConfirmed, setIsCheckInConfirmed] = useState(false)

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

  return (
    <main>
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
        <section aria-live="polite">
          <h2>Check-in concluído</h2>

          <p>Energia: {ENERGY_LABELS[energy]}</p>
          <p>Tempo disponível: {availableMinutes} minutos</p>
        </section>
      )}
    </main>
  )
}

export default NowPage
