// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import DailyMissionBoard from './DailyMissionBoard'

afterEach(cleanup)

const emptyCallbacks = {
  onStartFocus: () => {},
  onChooseMission: () => {},
  onCompleteMission: () => {},
  onReopenMission: () => {},
}

function renderBoard({
  missions = [],
  selectedMissionIds = {
    main: null,
    maintenance: null,
    care: null,
  },
} = {}) {
  render(
    <DailyMissionBoard
      missions={missions}
      selectedMissionIds={selectedMissionIds}
      boardRef={null}
      {...emptyCallbacks}
    />,
  )
}

describe('DailyMissionBoard', () => {
  it('mostra o progresso vazio com valores acessíveis', () => {
    renderBoard()

    expect(
      screen.getByText('Nenhuma missão escolhida para hoje.'),
    ).toBeTruthy()

    const progress = screen.getByRole('progressbar', {
      name: 'Nenhuma missão escolhida para hoje',
    })

    expect(progress.getAttribute('value')).toBe('0')
    expect(progress.getAttribute('max')).toBe('1')
  })

  it('mostra uma missão escolhida e concluída', () => {
    renderBoard({
      missions: [
        {
          id: 'mission-1',
          title: 'Revisar documento',
          status: 'completed',
          nextAction: 'Abrir o documento',
        },
      ],
      selectedMissionIds: {
        main: 'mission-1',
        maintenance: null,
        care: null,
      },
    })

    expect(
      screen.getByText('1 de 1 missão escolhida concluída'),
    ).toBeTruthy()

    const progress = screen.getByRole('progressbar')

    expect(progress.getAttribute('value')).toBe('1')
    expect(progress.getAttribute('max')).toBe('1')
  })
})
