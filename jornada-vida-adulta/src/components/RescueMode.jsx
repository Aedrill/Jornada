export default function RescueMode({ active }) {
  if (!active) return null
  return <div className="time-budget over"><strong>Modo resgate</strong><small>Escolha a menor ação possível e deixe o restante para depois.</small></div>
}
