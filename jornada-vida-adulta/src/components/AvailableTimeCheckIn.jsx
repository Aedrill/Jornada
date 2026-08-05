import { useState } from 'react'

const TIME_OPTIONS = [
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '60 minutos' },
]

function AvailableTimeCheckIn({ value, onChange }) {
  const isPresetValue = TIME_OPTIONS.some(
    (option) => option.value === value,
  )
  const [isCustomSelected, setIsCustomSelected] = useState(
    value !== null && !isPresetValue,
  )
  const [customTime, setCustomTime] = useState(
    value !== null && !isPresetValue ? String(value) : '',
  )

  function handlePresetChange(minutes) {
    setIsCustomSelected(false)
    setCustomTime('')
    onChange(minutes)
  }

  function handleCustomSelect() {
    setIsCustomSelected(true)
    setCustomTime('')
    onChange(null)
  }

  function handleCustomTimeChange(event) {
    const nextValue = event.target.value
    const numericValue = Number(nextValue)
    const isValid =
      nextValue !== '' &&
      Number.isInteger(numericValue) &&
      numericValue > 0

    setCustomTime(nextValue)
    onChange(isValid ? numericValue : null)
  }

  const isCustomValueActive =
    isCustomSelected ||
    (value !== null && !isPresetValue)
  const isCustomTimeValid =
    customTime !== '' &&
    Number.isInteger(Number(customTime)) &&
    Number(customTime) > 0

  return (
    <section aria-labelledby="available-time-title">
      <h2 id="available-time-title">
        Quanto tempo você tem agora?
      </h2>

      <div className="time-options">
        {TIME_OPTIONS.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handlePresetChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}

        <button
          type="button"
          aria-pressed={isCustomValueActive}
          onClick={handleCustomSelect}
        >
          Personalizado
        </button>
      </div>

      {isCustomSelected && (
        <div className="custom-time-field">
          <label htmlFor="custom-available-time">
            Tempo disponível em minutos
          </label>

          <input
            id="custom-available-time"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={customTime}
            onChange={handleCustomTimeChange}
            aria-describedby={
              isCustomTimeValid
                ? undefined
                : 'custom-time-guidance'
            }
            aria-invalid={!isCustomTimeValid}
          />

          {!isCustomTimeValid && (
            <p id="custom-time-guidance">
              Digite um número inteiro maior que zero.
            </p>
          )}
        </div>
      )}

      {value !== null && (
        <p>Tempo disponível registrado.</p>
      )}
    </section>
  )
}

export default AvailableTimeCheckIn
