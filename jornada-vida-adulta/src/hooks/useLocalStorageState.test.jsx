// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useLocalStorageState from './useLocalStorageState'

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('usa o valor inicial quando a chave não existe', () => {
    const { result } = renderHook(() =>
      useLocalStorageState('jornada:test:initial', ['inicial']),
    )

    expect(result.current[0]).toEqual(['inicial'])
  })

  it('carrega um valor previamente armazenado', () => {
    window.localStorage.setItem(
      'jornada:test:stored',
      JSON.stringify(['persistido']),
    )

    const { result } = renderHook(() =>
      useLocalStorageState('jornada:test:stored', []),
    )

    expect(result.current[0]).toEqual(['persistido'])
  })

  it('salva alterações no localStorage', async () => {
    const { result } = renderHook(() =>
      useLocalStorageState('jornada:test:write', []),
    )

    act(() => {
      result.current[1](['nova missão'])
    })

    await waitFor(() => {
      expect(
        JSON.parse(
          window.localStorage.getItem('jornada:test:write'),
        ),
      ).toEqual(['nova missão'])
    })
  })

  it('mantém o valor salvo após uma nova montagem', async () => {
    const firstRender = renderHook(() =>
      useLocalStorageState('jornada:test:remount', []),
    )

    act(() => {
      firstRender.result.current[1](['continua aqui'])
    })

    await waitFor(() => {
      expect(
        window.localStorage.getItem('jornada:test:remount'),
      ).toBe(JSON.stringify(['continua aqui']))
    })

    firstRender.unmount()

    const secondRender = renderHook(() =>
      useLocalStorageState('jornada:test:remount', []),
    )

    expect(secondRender.result.current[0]).toEqual([
      'continua aqui',
    ])
  })

  it('recupera o valor inicial quando o JSON é inválido', () => {
    window.localStorage.setItem(
      'jornada:test:invalid',
      'json inválido',
    )
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const { result } = renderHook(() =>
      useLocalStorageState(
        'jornada:test:invalid',
        ['recuperado'],
      ),
    )

    expect(result.current[0]).toEqual(['recuperado'])
    expect(consoleError).toHaveBeenCalledOnce()

    consoleError.mockRestore()
  })
})
