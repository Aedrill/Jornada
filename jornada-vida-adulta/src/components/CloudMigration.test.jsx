// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import {
  createInitialUserState,
  getUserState,
} from '../services/userStateService'
import {
  createBackupPayload,
  createCanonicalBackupSnapshot,
  downloadBackupPayload,
} from '../utils/dataBackup'
import CloudMigration from './CloudMigration'
import { SYNC_STATE_KEY, createSyncReference } from '../utils/syncState'

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/userStateService', () => ({
  getUserState: vi.fn(),
  createInitialUserState: vi.fn(),
  getUserStateErrorMessage: () =>
    'Não foi possível concluir esta ação. Tente novamente.',
}))

vi.mock('../utils/dataBackup', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createCanonicalBackupSnapshot: vi.fn((payload) =>
      JSON.parse(JSON.stringify(payload)),
    ),
    downloadBackupPayload: vi.fn(),
  }
})

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'pessoa@example.com',
}

const props = {
  captures: [{ id: 'capture-1' }, { id: 'capture-2' }],
  missions: [
    { id: 'mission-1', status: 'active' },
    { id: 'mission-2', status: 'active' },
    { id: 'mission-3', status: 'completed' },
  ],
  activeFocusSession: { id: 'active-focus' },
  focusSessions: [{ id: 'focus-1' }],
  dailyPlan: { dateKey: '2026-08-05', selections: {} },
}

const existingRow = {
  userId: user.id,
  schemaVersion: 1,
  revision: 2,
  createdAt: '2026-08-05T12:00:00.000Z',
  updatedAt: '2026-08-05T13:00:00.000Z',
  stateData: createBackupPayload({ ...props, exportedAt: '2026-08-05T12:00:00.000Z' }),
}

function connectedAuth() {
  return {
    user,
    isConfigured: true,
    isLoading: false,
  }
}

async function verifyEmptyVault() {
  getUserState.mockResolvedValueOnce(null)
  fireEvent.click(
    screen.getByRole('button', { name: 'Verificar meu cofre' }),
  )
  await screen.findByRole('button', {
    name: 'Preparar minha cópia inicial',
  })
}

async function prepareConfirmation() {
  await verifyEmptyVault()
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Preparar minha cópia inicial',
    }),
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Guardar esta cópia na nuvem',
    }),
  )
}

async function startComparison(remote = existingRow, renderProps = props) {
  getUserState.mockResolvedValue(remote)
  const view = render(<CloudMigration {...renderProps} />)
  fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))
  return view
}

function storeReference(remote = existingRow) {
  const reference = createSyncReference(user.id, remote, '2026-08-05T14:00:00.000Z')
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(reference))
  return reference
}

describe('CloudMigration', () => {
  beforeEach(() => {
    useAuth.mockReturnValue(connectedAuth())
    createCanonicalBackupSnapshot.mockReset()
    createCanonicalBackupSnapshot.mockImplementation((payload) =>
      JSON.parse(JSON.stringify(payload)),
    )
    downloadBackupPayload.mockClear()
    downloadBackupPayload.mockReturnValue(
      'jornada-backup-2026-08-05-1200.json',
    )
    getUserState.mockReset()
    createInitialUserState.mockReset()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('sem conta não consulta o serviço', () => {
    useAuth.mockReturnValue({
      user: null,
      isConfigured: true,
      isLoading: false,
    })
    render(<CloudMigration {...props} />)

    expect(screen.getByText(/Entre na sua conta/)).toBeTruthy()
    expect(getUserState).not.toHaveBeenCalled()
  })

  it('conta conectada não consulta automaticamente', () => {
    render(<CloudMigration {...props} />)

    expect(
      screen.getByRole('button', { name: 'Verificar meu cofre' }),
    ).toBeTruthy()
    expect(getUserState).not.toHaveBeenCalled()
  })

  it('consulta somente após clicar em verificar', async () => {
    getUserState.mockResolvedValue(null)
    render(<CloudMigration {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Verificar meu cofre' }),
    )

    await waitFor(() =>
      expect(getUserState).toHaveBeenCalledWith(user.id),
    )
  })

  it('cofre existente não oferece envio nem altera dados locais', async () => {
    window.localStorage.setItem(
      'jornada:v2:missions',
      JSON.stringify(props.missions),
    )
    getUserState.mockResolvedValue(existingRow)
    render(<CloudMigration {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Verificar meu cofre' }),
    )

    expect(
      await screen.findByText('Seu cofre já possui uma cópia'),
    ).toBeTruthy()
    expect(
      screen.queryByText('Guardar esta cópia na nuvem'),
    ).toBeNull()
    expect(window.localStorage.getItem('jornada:v2:missions')).toBe(
      JSON.stringify(props.missions),
    )
  })

  it('vincula o dispositivo quando a primeira comparação é igual', async () => {
    getUserState.mockResolvedValue(existingRow)
    render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))

    expect(await screen.findByText('Tudo em dia')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('jornada:v2:sync-state'))).toMatchObject({
      userId: user.id,
      baseRevision: 2,
    })
  })

  it('não vincula quando as cópias diferem e não expõe textos', async () => {
    getUserState.mockResolvedValue({
      ...existingRow,
      stateData: createBackupPayload({ ...props, captures: [], exportedAt: existingRow.stateData.exportedAt }),
    })
    render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))

    expect(await screen.findByText('Este dispositivo ainda não está vinculado')).toBeTruthy()
    expect(localStorage.getItem('jornada:v2:sync-state')).toBeNull()
  })

  it('mostra in_sync com referência existente', async () => {
    storeReference()
    await startComparison()
    expect(await screen.findByText('Tudo em dia')).toBeTruthy()
    expect(screen.getByText('Este dispositivo e o cofre possuem a mesma versão.')).toBeTruthy()
  })

  it('em in_sync atualiza somente lastCheckedAt', async () => {
    const before = storeReference()
    await startComparison()
    await screen.findByText('Tudo em dia')
    const after = JSON.parse(localStorage.getItem(SYNC_STATE_KEY))
    expect(after.lastCheckedAt).not.toBe(before.lastCheckedAt)
    expect(after).toMatchObject({
      linkedAt: before.linkedAt,
      baseRevision: before.baseRevision,
      baseSnapshot: before.baseSnapshot,
    })
  })

  it.each([
    ['local_ahead', { ...props, captures: [...props.captures, { id: 'nova' }] }, existingRow, 'Há alterações neste dispositivo', 'Nada foi enviado. Seus dados locais continuam preservados.'],
    ['remote_ahead', props, { ...existingRow, revision: 3 }, 'Há uma versão mais recente no cofre', 'Nada foi baixado ou substituído.'],
    ['conflict', { ...props, captures: [...props.captures, { id: 'nova' }] }, { ...existingRow, revision: 3 }, 'Os dois lados possuem alterações', 'Nenhuma versão foi substituída. A escolha será feita em uma próxima etapa.'],
  ])('%s preserva a referência e mostra a mensagem segura', async (_status, localProps, remote, title, message) => {
    const before = storeReference()
    await startComparison(remote, localProps)
    expect(await screen.findByText(title)).toBeTruthy()
    expect(screen.getByText(message)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(SYNC_STATE_KEY))).toEqual(before)
  })

  it('clique duplo cria somente uma consulta de comparação', async () => {
    let resolveComparison
    getUserState.mockResolvedValueOnce(existingRow).mockReturnValueOnce(
      new Promise((resolve) => { resolveComparison = resolve }),
    )
    render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    const button = await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(getUserState).toHaveBeenCalledTimes(2)
    resolveComparison(existingRow)
    await screen.findByText('Tudo em dia')
  })

  it('troca de conta durante comparação descarta a resposta', async () => {
    let resolveComparison
    getUserState.mockResolvedValueOnce(existingRow).mockReturnValueOnce(
      new Promise((resolve) => { resolveComparison = resolve }),
    )
    const { rerender } = render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))
    useAuth.mockReturnValue({ ...connectedAuth(), user: { ...user, id: '22222222-2222-4222-8222-222222222222' } })
    rerender(<CloudMigration {...props} />)
    resolveComparison(existingRow)
    await waitFor(() => expect(screen.queryByText('Tudo em dia')).toBeNull())
    expect(localStorage.getItem(SYNC_STATE_KEY)).toBeNull()
  })

  it('desmontagem durante comparação descarta a resposta', async () => {
    let resolveComparison
    getUserState.mockResolvedValueOnce(existingRow).mockReturnValueOnce(
      new Promise((resolve) => { resolveComparison = resolve }),
    )
    const { unmount } = render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))
    unmount()
    resolveComparison(existingRow)
    await Promise.resolve()
    expect(localStorage.getItem(SYNC_STATE_KEY)).toBeNull()
  })

  it('erro de rede não altera sync-state', async () => {
    const before = storeReference()
    getUserState.mockResolvedValueOnce(existingRow).mockRejectedValueOnce(new TypeError('offline'))
    render(<CloudMigration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Verificar meu cofre' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Comparar este dispositivo com o cofre' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(SYNC_STATE_KEY))).toEqual(before)
  })

  it.each([
    ['snapshot remoto inválido', { ...existingRow, stateData: { invalid: true } }],
    ['userId remoto divergente', { ...existingRow, userId: '22222222-2222-4222-8222-222222222222' }],
    ['schemaVersion remoto divergente', { ...existingRow, schemaVersion: 2 }],
  ])('%s não altera sync-state', async (_label, remote) => {
    const before = storeReference()
    await startComparison(remote)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem(SYNC_STATE_KEY))).toEqual(before)
  })

  it('falha de localStorage não altera dados funcionais', async () => {
    const functionalState = {
      'jornada:v2:captures': '[{"id":"capture-local"}]',
      'jornada:v2:missions': '[{"id":"mission-local"}]',
      'jornada:v2:active-focus-session': 'null',
      'jornada:v2:focus-sessions': '[]',
      'jornada:v2:daily-plan': '{"dateKey":"2026-08-05"}',
    }
    Object.entries(functionalState).forEach(([key, value]) => localStorage.setItem(key, value))
    const originalSetItem = Storage.prototype.setItem
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === SYNC_STATE_KEY) throw new Error('storage unavailable')
      return originalSetItem.call(this, key, value)
    })
    await startComparison()
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(Object.fromEntries(Object.keys(functionalState).map((key) => [key, localStorage.getItem(key)]))).toEqual(functionalState)
    setItemSpy.mockRestore()
  })

  it('diagnóstico preserva as cinco chaves e nunca chama createInitialUserState', async () => {
    const keys = [
      'jornada:v2:captures', 'jornada:v2:missions', 'jornada:v2:active-focus-session',
      'jornada:v2:focus-sessions', 'jornada:v2:daily-plan',
    ]
    keys.forEach((key, index) => localStorage.setItem(key, `valor-${index}`))
    await startComparison()
    await screen.findByText('Tudo em dia')
    expect(keys.map((key) => localStorage.getItem(key))).toEqual(keys.map((_key, index) => `valor-${index}`))
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('resumo local mantém exportedAt atual sem receber a normalização da comparação', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-08-06T15:30:00.000Z'))
    storeReference()
    await startComparison()
    await screen.findByText('Tudo em dia')
    expect(screen.getByText(`Snapshot criado em: ${new Date('2026-08-06T15:30:00.000Z').toLocaleString('pt-BR')}`)).toBeTruthy()
    const snapshotDates = createCanonicalBackupSnapshot.mock.calls.map(([value]) => value?.exportedAt)
    expect(snapshotDates).toContain(existingRow.stateData.exportedAt)
    expect(snapshotDates.some((date) => date !== existingRow.stateData.exportedAt)).toBe(true)
  })

  it('cofre vazio cria prévia com todas as quantidades', async () => {
    render(<CloudMigration {...props} />)
    await verifyEmptyVault()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Preparar minha cópia inicial',
      }),
    )

    expect(screen.getByText('Capturas: 2')).toBeTruthy()
    expect(screen.getByText('Missões: 3')).toBeTruthy()
    expect(screen.getByText('Missões ativas: 2')).toBeTruthy()
    expect(screen.getByText('Missões concluídas: 1')).toBeTruthy()
    expect(screen.getByText('Sessões de foco: 1')).toBeTruthy()
    expect(screen.getByText('Foco em andamento: Sim')).toBeTruthy()
    expect(screen.getByText('Planejamento: 2026-08-05')).toBeTruthy()
    expect(screen.getByText('Versão: 1')).toBeTruthy()
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('cancelar fecha a confirmação sem operação remota', async () => {
    render(<CloudMigration {...props} />)
    await prepareConfirmation()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.getByRole('button', {
        name: 'Guardar esta cópia na nuvem',
      }),
    ).toBeTruthy()
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('falha no download impede qualquer operação remota final', async () => {
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockClear()
    downloadBackupPayload.mockImplementation(() => {
      throw new Error('private snapshot detail')
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(getUserState).not.toHaveBeenCalled()
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('baixa antes da consulta final e consulta novamente', async () => {
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockClear()
    getUserState.mockResolvedValueOnce(existingRow)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )
    await screen.findByText('Seu cofre já possui uma cópia')

    expect(downloadBackupPayload).toHaveBeenCalledTimes(1)
    expect(getUserState).toHaveBeenCalledTimes(1)
    expect(
      downloadBackupPayload.mock.invocationCallOrder[0],
    ).toBeLessThan(getUserState.mock.invocationCallOrder[0])
  })

  it('linha surgindo antes do envio impede INSERT', async () => {
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockResolvedValueOnce(existingRow)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )

    await screen.findByText('Seu cofre já possui uma cópia')
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('envia exatamente o mesmo payload que foi baixado', async () => {
    createInitialUserState.mockImplementation(async (_id, snapshot) => ({
      ...existingRow,
      revision: 1,
      stateData: snapshot,
    }))
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockResolvedValueOnce(null)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )
    await screen.findByText('Cópia inicial guardada com segurança.')

    const downloadedSnapshot = downloadBackupPayload.mock.calls[0][0]
    expect(createInitialUserState.mock.calls[0][1]).toBe(
      downloadedSnapshot,
    )
  })

  it('mantém independente o snapshot após mutação aninhada das props', async () => {
    createInitialUserState.mockImplementation(async (_id, snapshot) => ({
      ...existingRow,
      revision: 1,
      stateData: snapshot,
    }))
    const mutableProps = {
      ...props,
      captures: [
        {
          id: 'capture-1',
          detail: { text: 'estado da prévia' },
        },
      ],
    }
    render(<CloudMigration {...mutableProps} />)
    await prepareConfirmation()
    mutableProps.captures[0].detail.text = 'mudança posterior'
    getUserState.mockResolvedValueOnce(null)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )
    await screen.findByText('Cópia inicial guardada com segurança.')

    const downloadedSnapshot = downloadBackupPayload.mock.calls[0][0]
    const insertedSnapshot = createInitialUserState.mock.calls[0][1]

    expect(downloadedSnapshot.data.captures[0].detail.text).toBe(
      'estado da prévia',
    )
    expect(insertedSnapshot).toBe(downloadedSnapshot)
  })

  it('falha canônica não baixa nem acessa serviços remotos', async () => {
    render(<CloudMigration {...props} />)
    await verifyEmptyVault()
    getUserState.mockClear()
    createCanonicalBackupSnapshot.mockImplementation(() => {
      throw new Error('private canonical detail')
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Preparar minha cópia inicial',
      }),
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Não foi possível preparar')
    expect(alert.textContent).not.toContain('private canonical detail')
    expect(screen.queryByText('Prévia da cópia inicial')).toBeNull()
    expect(downloadBackupPayload).not.toHaveBeenCalled()
    expect(getUserState).not.toHaveBeenCalled()
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('sucesso preserva as cinco chaves locais', async () => {
    const localState = {
      'jornada:v2:captures': '[{"id":"capture-local"}]',
      'jornada:v2:missions': '[{"id":"mission-local"}]',
      'jornada:v2:active-focus-session': 'null',
      'jornada:v2:focus-sessions': '[]',
      'jornada:v2:daily-plan': '{"dateKey":"2026-08-05"}',
    }
    Object.entries(localState).forEach(([key, value]) =>
      window.localStorage.setItem(key, value),
    )
    createInitialUserState.mockResolvedValue({
      ...existingRow,
      revision: 1,
    })
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockResolvedValueOnce(null)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )
    await screen.findByText('Cópia inicial guardada com segurança.')

    expect(
      Object.fromEntries(
        Object.keys(localState).map((key) => [
          key,
          window.localStorage.getItem(key),
        ]),
      ),
    ).toEqual(localState)
  })

  it('sucesso mostra revisão e versão confirmadas', async () => {
    createInitialUserState.mockResolvedValue({
      ...existingRow,
      revision: 1,
    })
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockResolvedValueOnce(null)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )

    await screen.findByText('Cópia inicial guardada com segurança.')
    expect(screen.getByText('Revisão: 1')).toBeTruthy()
    expect(screen.getByText('Versão: 1')).toBeTruthy()
    expect(screen.getByText(/continuam intactos/)).toBeTruthy()
  })

  it('conflito não repete a criação', async () => {
    createInitialUserState.mockRejectedValue({
      code: 'user_state_already_exists',
    })
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockResolvedValueOnce(null)

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar e guardar' }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Seu cofre já possui uma cópia',
      }),
    ).toBeTruthy()
    expect(createInitialUserState).toHaveBeenCalledTimes(1)
  })

  it('clique duplo não cria duas inserções', async () => {
    let resolveCheck
    const finalCheck = new Promise((resolve) => {
      resolveCheck = resolve
    })
    render(<CloudMigration {...props} />)
    await prepareConfirmation()
    getUserState.mockReturnValueOnce(finalCheck)

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar e guardar',
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)
    resolveCheck(existingRow)

    await screen.findByText('Seu cofre já possui uma cópia')
    expect(downloadBackupPayload).toHaveBeenCalledTimes(1)
    expect(createInitialUserState).not.toHaveBeenCalled()
  })

  it('logout durante requisição descarta a resposta antiga', async () => {
    let resolveCheck
    getUserState.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve
      }),
    )
    const { rerender } = render(<CloudMigration {...props} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Verificar meu cofre' }),
    )

    useAuth.mockReturnValue({
      user: null,
      isConfigured: true,
      isLoading: false,
    })
    rerender(<CloudMigration {...props} />)
    resolveCheck(null)

    await waitFor(() =>
      expect(screen.getByText(/Entre na sua conta/)).toBeTruthy(),
    )
    expect(
      screen.queryByText(/Seu cofre está vazio/),
    ).toBeNull()
  })

  it('erros não revelam conteúdo privado', async () => {
    getUserState.mockRejectedValue({
      code: 'unknown',
      snapshot: 'segredo privado',
    })
    render(<CloudMigration {...props} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Verificar meu cofre' }),
    )

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Não foi possível concluir')
    expect(alert.textContent).not.toContain('segredo privado')
  })
})
