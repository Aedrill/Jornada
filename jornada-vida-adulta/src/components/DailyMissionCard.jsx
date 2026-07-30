export default function DailyMissionCard({ mission, index, done, onToggle }) {
  return <button className={done ? 'mission done' : 'mission'} onClick={() => onToggle(mission.id)}><i>{done ? '✓' : index + 1}</i><span><strong>{mission.title}</strong><small>{mission.category} · {mission.minutes} min</small></span><em>+{mission.xp} XP</em></button>
}
