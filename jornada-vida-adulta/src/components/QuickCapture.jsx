export default function QuickCapture({ value, onChange, onSubmit }) {
  return <form className="capture-form panel" onSubmit={onSubmit}><label htmlFor="capture">O que você não quer esquecer?</label><div><input id="capture" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Escreva uma ideia, tarefa ou lembrete..." autoFocus /><button>Guardar ideia</button></div></form>
}
