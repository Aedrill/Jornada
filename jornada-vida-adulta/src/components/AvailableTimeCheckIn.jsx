const TIME_OPTIONS = [
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: 'Mais de 30' },
]

function AvailableTimeCheckIn({ value, onChange }) {
  return (
    <section aria-labelledby="available-time-title">
      <h2 id="available-time-title">
        Quanto tempo você tem agora?
      </h2>

      <div>
        {TIME_OPTIONS.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {value !== null && (
        <p>Tempo disponível registrado.</p>
      )}
    </section>
  )
}

export default AvailableTimeCheckIn
