import { useState } from 'react'
import AvailableTimeCheckIn from '../components/AvailableTimeCheckIn'
import EnergyCheckIn from '../components/EnergyCheckIn'

function NowPage() {
  const [energy, setEnergy] = useState('')
  const [availableMinutes, setAvailableMinutes] = useState(null)

  return (
    <main>
      <h1>Agora</h1>

      <EnergyCheckIn
        value={energy}
        onChange={setEnergy}
      />

      <AvailableTimeCheckIn
        value={availableMinutes}
        onChange={setAvailableMinutes}
      />
    </main>
  )
}

export default NowPage
