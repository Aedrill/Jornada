import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBackupPayload } from '../utils/dataBackup'
import {
  createInitialUserState,
  getUserState,
} from './userStateService'

const clientState = vi.hoisted(() => ({
  configured: true,
  from: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  get isSupabaseConfigured() {
    return clientState.configured
  },
  supabase: {
    from: (...args) => clientState.from(...args),
  },
}))

const userId = '11111111-1111-4111-8111-111111111111'
const snapshot = createBackupPayload({
  captures: [],
  missions: [],
  activeFocusSession: null,
  focusSessions: [],
  dailyPlan: { dateKey: '2026-08-05' },
  exportedAt: '2026-08-05T12:00:00.000Z',
})

function createReadQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
  clientState.from.mockReturnValue(query)
  return query
}

function createInsertQuery(result) {
  const query = {
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue(result),
  }
  clientState.from.mockReturnValue(query)
  return query
}

function databaseRow(overrides = {}) {
  return {
    user_id: userId,
    state_data: snapshot,
    schema_version: 1,
    revision: 1,
    created_at: '2026-08-05T12:00:01.000Z',
    updated_at: '2026-08-05T12:00:01.000Z',
    ...overrides,
  }
}

describe('userStateService', () => {
  beforeEach(() => {
    clientState.configured = true
    clientState.from.mockReset()
  })

  it('recusa ausência de configuração', async () => {
    clientState.configured = false

    await expect(getUserState(userId)).rejects.toMatchObject({
      code: 'not_configured',
    })
    expect(clientState.from).not.toHaveBeenCalled()
  })

  it('recusa userId inválido', async () => {
    await expect(getUserState('inválido')).rejects.toMatchObject({
      code: 'session_missing',
    })
  })

  it('filtra a leitura por user_id e usa maybeSingle', async () => {
    const query = createReadQuery({ data: null, error: null })

    await getUserState(userId)

    expect(clientState.from).toHaveBeenCalledWith('user_state')
    expect(query.eq).toHaveBeenCalledWith('user_id', userId)
    expect(query.maybeSingle).toHaveBeenCalledTimes(1)
    expect(query.select).toHaveBeenCalledWith(
      'user_id,state_data,schema_version,revision,created_at,updated_at',
    )
  })

  it('retorna null quando não há linha', async () => {
    createReadQuery({ data: null, error: null })
    await expect(getUserState(userId)).resolves.toBeNull()
  })

  it('normaliza a linha lida', async () => {
    createReadQuery({ data: databaseRow(), error: null })

    await expect(getUserState(userId)).resolves.toEqual({
      userId,
      stateData: snapshot,
      schemaVersion: 1,
      revision: 1,
      createdAt: '2026-08-05T12:00:01.000Z',
      updatedAt: '2026-08-05T12:00:01.000Z',
    })
  })

  it('normaliza erro de rede', async () => {
    const query = createReadQuery({ data: null, error: null })
    query.maybeSingle.mockRejectedValue(new TypeError('private detail'))

    await expect(getUserState(userId)).rejects.toMatchObject({
      code: 'network_error',
    })
  })

  it('normaliza erro de permissão sem expor detalhes', async () => {
    createReadQuery({
      data: null,
      error: { code: '42501', message: 'private database detail' },
    })

    await expect(getUserState(userId)).rejects.toMatchObject({
      code: 'permission_denied',
    })
  })

  it('envia somente usuário, payload completo e schema no INSERT', async () => {
    const query = createInsertQuery({
      data: databaseRow(),
      error: null,
    })

    await createInitialUserState(userId, snapshot)

    expect(query.insert).toHaveBeenCalledWith({
      user_id: userId,
      state_data: snapshot,
      schema_version: snapshot.schemaVersion,
    })
    const inserted = query.insert.mock.calls[0][0]
    expect(inserted).not.toHaveProperty('revision')
    expect(inserted).not.toHaveProperty('created_at')
    expect(inserted).not.toHaveProperty('updated_at')
  })

  it('encadeia select e single no INSERT', async () => {
    const query = createInsertQuery({
      data: databaseRow(),
      error: null,
    })

    await createInitialUserState(userId, snapshot)

    expect(query.select).toHaveBeenCalledTimes(1)
    expect(query.single).toHaveBeenCalledTimes(1)
  })

  it('aceita resposta confirmada com revision 1', async () => {
    createInsertQuery({ data: databaseRow(), error: null })

    await expect(
      createInitialUserState(userId, snapshot),
    ).resolves.toMatchObject({ revision: 1, schemaVersion: 1 })
  })

  it('rejeita resposta que não confirma revision 1', async () => {
    createInsertQuery({
      data: databaseRow({ revision: 2 }),
      error: null,
    })

    await expect(
      createInitialUserState(userId, snapshot),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('rejeita snapshot inválido antes da rede', async () => {
    await expect(
      createInitialUserState(userId, { private: 'detail' }),
    ).rejects.toMatchObject({ code: 'invalid_snapshot' })
    expect(clientState.from).not.toHaveBeenCalled()
  })

  it('mapeia conflito de chave para cofre existente', async () => {
    createInsertQuery({
      data: null,
      error: { code: '23505', message: 'private detail' },
    })

    await expect(
      createInitialUserState(userId, snapshot),
    ).rejects.toMatchObject({
      code: 'user_state_already_exists',
    })
  })
})
