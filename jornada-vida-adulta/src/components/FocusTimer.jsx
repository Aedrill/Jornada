import StartButton from './StartButton'

function formatTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export default function FocusTimer({ seconds, running, onToggle, onReset }) {
  return <article className="panel focus"><div className="panel-title"><div><span className="eyebrow">MOMENTO DE PRESENÇA</span><h2>Foco gentil</h2></div><b>◉</b></div><div className="timer">{formatTime(seconds)}</div><p>Uma sessão curta para começar sem pressão.</p><div className="timer-buttons"><StartButton running={running} onClick={onToggle} /><button onClick={onReset}>Reiniciar</button></div><small className="tip">✦ Você não precisa terminar tudo. Só precisa começar.</small></article>
}
