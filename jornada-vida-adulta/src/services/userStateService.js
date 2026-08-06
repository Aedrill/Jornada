import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'
import {
  BACKUP_SCHEMA_VERSION,
  validateBackupPayload,
} from '../utils/dataBackup'
import { areJsonValuesEqual } from '../utils/jsonEquality'

const USER_STATE_FIELDS = [
  'user_id',
  'state_data',
  'schema_version',
  'revision',
  'created_at',
  'updated_at',
].join(',')

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ERROR_MESSAGES = {
  not_configured:
    'A conexão segura ainda não está configurada neste ambiente.',
  session_missing: 'Entre na sua conta para continuar.',
  network_error:
    'Não foi possível conectar agora. Verifique sua internet e tente novamente.',
  permission_denied:
    'Sua conta não pôde acessar o cofre com segurança.',
  invalid_snapshot:
    'Não foi possível preparar uma cópia válida dos seus dados.',
  invalid_response:
    'O cofre respondeu de forma inesperada. Nada foi alterado.',
  user_state_already_exists:
    'Seu cofre já possui uma cópia. Nada foi substituído.',
}

export class UserStateServiceError extends Error {
  constructor(code) {
    super('User state action failed')
    this.name = 'UserStateServiceError'
    this.code = code
  }
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new UserStateServiceError('not_configured')
  }
}

function requireUserId(userId) {
  if (typeof userId !== 'string' || !USER_ID_PATTERN.test(userId)) {
    throw new UserStateServiceError('session_missing')
  }
}

function normalizeError(error) {
  if (error instanceof UserStateServiceError) {
    return error
  }

  if (error instanceof TypeError) {
    return new UserStateServiceError('network_error')
  }

  if (error?.code === '23505') {
    return new UserStateServiceError('user_state_already_exists')
  }

  if (
    error?.code === '42501' ||
    error?.code === 'PGRST301'
  ) {
    return new UserStateServiceError('permission_denied')
  }

  return new UserStateServiceError('unknown')
}

function normalizeRow(row) {
  return {
    userId: row.user_id,
    stateData: row.state_data,
    schemaVersion: row.schema_version,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function validateCreatedRow(row, userId, snapshot) {
  if (
    !row ||
    row.user_id !== userId ||
    row.schema_version !== snapshot.schemaVersion ||
    row.revision !== 1 ||
    !validateBackupPayload(row.state_data).isValid ||
    !areJsonValuesEqual(row.state_data, snapshot)
  ) {
    throw new UserStateServiceError('invalid_response')
  }
}

export function getUserStateErrorMessage(error) {
  return (
    ERROR_MESSAGES[error?.code] ||
    'Não foi possível concluir esta ação. Tente novamente.'
  )
}

export async function getUserState(userId) {
  requireClient()
  requireUserId(userId)

  try {
    const { data, error } = await supabase
      .from('user_state')
      .select(USER_STATE_FIELDS)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? normalizeRow(data) : null
  } catch (error) {
    throw normalizeError(error)
  }
}

export async function createInitialUserState(userId, snapshot) {
  requireClient()
  requireUserId(userId)

  if (
    !validateBackupPayload(snapshot).isValid ||
    snapshot.schemaVersion !== BACKUP_SCHEMA_VERSION
  ) {
    throw new UserStateServiceError('invalid_snapshot')
  }

  try {
    const { data, error } = await supabase
      .from('user_state')
      .insert({
        user_id: userId,
        state_data: snapshot,
        schema_version: snapshot.schemaVersion,
      })
      .select(USER_STATE_FIELDS)
      .single()

    if (error) {
      throw error
    }

    validateCreatedRow(data, userId, snapshot)
    return normalizeRow(data)
  } catch (error) {
    throw normalizeError(error)
  }
}
