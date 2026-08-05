import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'

const AUTH_ERROR_MESSAGES = {
  invalid_credentials: 'E-mail ou senha inválidos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  weak_password: 'Use uma senha com pelo menos 8 caracteres.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  over_request_rate_limit:
    'Muitas tentativas. Aguarde um pouco e tente novamente.',
  over_email_send_rate_limit:
    'Muitas tentativas. Aguarde um pouco e tente novamente.',
  network_error:
    'Não foi possível conectar. Verifique sua internet e tente novamente.',
  not_configured:
    'A conexão segura ainda não está configurada neste ambiente.',
}

class AuthServiceError extends Error {
  constructor(code) {
    super('Authentication action failed')
    this.name = 'AuthServiceError'
    this.code = code
  }
}

function ensureConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new AuthServiceError('not_configured')
  }
}

function normalizeAuthError(error) {
  if (error instanceof AuthServiceError) {
    return error
  }

  if (error instanceof TypeError) {
    return new AuthServiceError('network_error')
  }

  return new AuthServiceError(error?.code || 'unknown')
}

async function runAuthAction(action) {
  ensureConfigured()

  try {
    const { data, error } = await action()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw normalizeAuthError(error)
  }
}

export function getAuthErrorMessage(error) {
  return (
    AUTH_ERROR_MESSAGES[error?.code] ||
    'Não foi possível concluir esta ação. Tente novamente.'
  )
}

export function signUpWithEmail(email, password) {
  return runAuthAction(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    }),
  )
}

export function signInWithEmail(email, password) {
  return runAuthAction(() =>
    supabase.auth.signInWithPassword({
      email,
      password,
    }),
  )
}

export async function signOut() {
  await runAuthAction(() => supabase.auth.signOut())
}

export async function getCurrentSession() {
  const data = await runAuthAction(() =>
    supabase.auth.getSession(),
  )

  return data.session ?? null
}

export function subscribeToAuthChanges(callback) {
  ensureConfigured()

  const { data } = supabase.auth.onAuthStateChange(
    (event, session) => callback(event, session),
  )

  return data.subscription
}
