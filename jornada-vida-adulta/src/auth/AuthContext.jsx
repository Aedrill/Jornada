import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import {
  getCurrentSession,
  signInWithEmail,
  signOut as signOutService,
  signUpWithEmail,
  subscribeToAuthChanges,
} from '../services/authService'

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(
    isSupabaseConfigured,
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true
    const subscription = subscribeToAuthChanges(
      (_event, nextSession) => {
        if (isMounted) {
          setSession(nextSession)
        }
      },
    )

    getCurrentSession()
      .then((currentSession) => {
        if (isMounted) {
          setSession(currentSession)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signUp(email, password) {
    const data = await signUpWithEmail(email, password)

    if (data.session) {
      setSession(data.session)
    }

    return data
  }

  async function signIn(email, password) {
    const data = await signInWithEmail(email, password)
    setSession(data.session ?? null)
    return data
  }

  async function signOut() {
    await signOutService()
    setSession(null)
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
    }),
    [isLoading, session],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
