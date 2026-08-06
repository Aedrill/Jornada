import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getAuthErrorMessage } from '../services/authService'

function AccountPanel() {
  const {
    user,
    isLoading,
    isConfigured,
    signUp,
    signIn,
    signOut,
  } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function handleModeChange(nextMode) {
    setMode(nextMode)
    setStatusMessage('')
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setStatusMessage('')
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('Digite seu e-mail.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Use uma senha com pelo menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        const data = await signUp(email.trim(), password)
        setPassword('')

        if (!data.session) {
          setStatusMessage(
            'Conta criada. Confira seu e-mail para confirmar o cadastro.',
          )
        }
      } else {
        await signIn(email.trim(), password)
        setPassword('')
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignOut() {
    if (isSubmitting) {
      return
    }

    setStatusMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await signOut()
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className="account-panel"
      aria-labelledby="account-panel-title"
    >
      <h2 id="account-panel-title">Sua conta</h2>

      {!isConfigured && (
        <p className="account-notice">
          A conexão segura ainda não está configurada neste
          ambiente.
        </p>
      )}

      {isConfigured && isLoading && (
        <p className="account-status" role="status">
          Verificando sua conta...
        </p>
      )}

      {isConfigured && !isLoading && user && (
        <div className="account-status">
          <h3>Conta conectada</h3>
          <p>{user.email}</p>
          <p className="account-notice">
            Sua conta está conectada. Em Meus dados, você pode
            criar uma cópia inicial no cofre. A sincronização
            automática ainda não existe, e sair da conta não
            remove os dados deste dispositivo.
          </p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSignOut}
          >
            Sair da conta
          </button>
        </div>
      )}

      {isConfigured && !isLoading && !user && (
        <>
          <div
            className="account-mode-selector"
            aria-label="Acesso à conta"
          >
            <button
              type="button"
              aria-pressed={mode === 'signin'}
              onClick={() => handleModeChange('signin')}
            >
              Entrar
            </button>
            <button
              type="button"
              aria-pressed={mode === 'signup'}
              onClick={() => handleModeChange('signup')}
            >
              Criar conta
            </button>
          </div>

          <p>
            {mode === 'signup'
              ? 'Crie uma conta para preparar a sincronização entre seus dispositivos.'
              : 'Entre na sua conta do NORTE.'}
          </p>

          <form className="account-form" onSubmit={handleSubmit}>
            <label className="account-field">
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="account-field">
              <span>Senha</span>
              <input
                type="password"
                minLength={8}
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Aguarde...'
                : mode === 'signup'
                  ? 'Criar conta'
                  : 'Entrar'}
            </button>
          </form>
        </>
      )}

      {errorMessage && (
        <p className="account-error" role="alert">
          {errorMessage}
        </p>
      )}

      {statusMessage && (
        <p className="account-status" role="status">
          {statusMessage}
        </p>
      )}
    </section>
  )
}

export default AccountPanel
