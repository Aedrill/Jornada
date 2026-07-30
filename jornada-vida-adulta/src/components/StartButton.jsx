export default function StartButton({ running, onClick }) {
  return <button onClick={onClick}>{running ? 'Pausar' : 'Começar foco'}</button>
}
