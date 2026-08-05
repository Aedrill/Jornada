import { describe, expect, it } from 'vitest'
import { getRemainingSeconds } from './focusTimer'

describe('getRemainingSeconds', () => {
  it('retorna o tempo armazenado quando o cronômetro está pausado', () => {
    const session = {
      remainingSeconds: 180,
      isTimerRunning: false,
      lastTimerStartedAt: null,
    }

    expect(getRemainingSeconds(session, Date.now())).toBe(180)
  })

  it('desconta o tempo real transcorrido quando está rodando', () => {
    const session = {
      remainingSeconds: 300,
      isTimerRunning: true,
      lastTimerStartedAt: '2026-08-05T12:00:00.000Z',
    }

    expect(
      getRemainingSeconds(
        session,
        new Date('2026-08-05T12:01:15.000Z').getTime(),
      ),
    ).toBe(225)
  })

  it('nunca retorna um valor negativo', () => {
    const session = {
      remainingSeconds: 30,
      isTimerRunning: true,
      lastTimerStartedAt: '2026-08-05T12:00:00.000Z',
    }

    expect(
      getRemainingSeconds(
        session,
        new Date('2026-08-05T12:05:00.000Z').getTime(),
      ),
    ).toBe(0)
  })

  it('retorna o valor armazenado quando a data é inválida', () => {
    const session = {
      remainingSeconds: 120,
      isTimerRunning: true,
      lastTimerStartedAt: 'data-inválida',
    }

    expect(getRemainingSeconds(session, Date.now())).toBe(120)
  })
})
