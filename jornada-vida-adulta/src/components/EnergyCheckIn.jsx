export default function EnergyCheckIn({ checkin, plannedMinutes, onChange }) {
  return (
    <div className="energy-checkin">
      <fieldset><legend>Como está sua energia agora?</legend><div>{[['low', 'Baixa'], ['medium', 'Média'], ['high', 'Alta']].map(([value, label]) => <button type="button" className={checkin.energy === value ? 'selected' : ''} key={value} onClick={() => onChange('energy', value)}>{label}</button>)}</div></fieldset>
      <fieldset><legend>Você tem quanto tempo?</legend><div>{[[5, '5 min'], [15, '15 min'], [30, '30 min'], [60, 'Mais']].map(([value, label]) => <button type="button" className={checkin.availableMinutes === value ? 'selected' : ''} key={value} onClick={() => onChange('availableMinutes', value)}>{label}</button>)}</div></fieldset>
      {plannedMinutes > checkin.availableMinutes && <small className="gentle-hint">Vamos começar menor que o plano. Tudo bem ajustar o restante depois.</small>}
    </div>
  )
}
