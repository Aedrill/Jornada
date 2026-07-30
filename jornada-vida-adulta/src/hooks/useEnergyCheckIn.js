import { useState } from 'react'

export function useEnergyCheckIn(initialCheckins) {
  const [checkins, setCheckins] = useState(initialCheckins)
  const checkin = checkins[0]
  const updateCheckin = (field, value) => setCheckins((items) => [{ ...items[0], [field]: value, createdAt: new Date().toISOString() }, ...items.slice(1)])
  return { checkin, checkins, updateCheckin }
}
