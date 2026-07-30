import { useState } from 'react'
import EnergyCheckIn from '../components/EnergyCheckIn'

function NowPage() {
  const [energy, setEnergy] = useState('')

  return (
    <main>
      <h1>Agora</h1>

      <EnergyCheckIn
        value={energy}
        onChange={setEnergy}
      />
    </main>
  )
}

export default NowPage
