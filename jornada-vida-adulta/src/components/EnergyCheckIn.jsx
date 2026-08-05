const ENERGY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

function EnergyCheckIn({ value, onChange }) {
  return (
    <section aria-labelledby="energy-title">
      <h2 id="energy-title">Como está sua energia agora?</h2>

      <div>
        {ENERGY_OPTIONS.map((option) => {
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

      {value && <p>Energia registrada.</p>}
    </section>
  )
}

export default EnergyCheckIn
