import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import { APP_VERSION, APP_VERSION_KEY, SESSION_VERSION_KEY } from '../config/app'

type UserType = 'guest' | 'host' | 'manager'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, companyName?: string, userType?: UserType) => Promise<{ error: Error | null }>
  signInWithGoogle: (userType?: UserType) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isSuperAdmin: boolean
  isHost: boolean
  isGuest: boolean
  isManager: boolean
  appVersion: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Verificar si la version de la app ha cambiado y limpiar sesion si es necesario
const checkAppVersion = (): boolean => {
  const storedVersion = localStorage.getItem(APP_VERSION_KEY)
  const sessionVersion = localStorage.getItem(SESSION_VERSION_KEY)


  // Primera vez que se carga la app o no hay sesión activa
  if (!sessionVersion) {
    localStorage.setItem(APP_VERSION_KEY, APP_VERSION)
    return false
  }

  // Si hay sesión activa y la version de la app cambio, invalidar la sesion
  if (storedVersion && storedVersion !== APP_VERSION) {
    localStorage.setItem(APP_VERSION_KEY, APP_VERSION)
    localStorage.removeItem(SESSION_VERSION_KEY)
    return true // Indica que debe cerrar sesion
  }

  // Versión no ha cambiado
  localStorage.setItem(APP_VERSION_KEY, APP_VERSION)
  return false
}

// Guardar version de sesion al hacer login
const saveSessionVersion = () => {
  localStorage.setItem(SESSION_VERSION_KEY, APP_VERSION)
  localStorage.setItem(APP_VERSION_KEY, APP_VERSION)
}

// Limpiar version de sesion al hacer logout
const clearSessionVersion = () => {
  localStorage.removeItem(SESSION_VERSION_KEY)
}

// Eliminar todos los tokens de Supabase del localStorage para evitar estados inconsistentes
const clearSupabaseStorage = () => {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith('sb-') || key.includes('supabase.auth')) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
  clearSessionVersion()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setVersionChecked] = useState(false)
  const [, setFetchingProfile] = useState(false)

  // Ref para evitar stale closure en fetchProfile (profile state siempre actualizado)
  const profileRef = useRef<Profile | null>(null)
  const setProfileSync = (p: Profile | null) => {
    profileRef.current = p
    setProfile(p)
  }

  // Lock robusto para fetchProfile usando ref
  const fetchProfileLockRef = useRef(false)
  const currentFetchPromiseRef = useRef<Promise<void> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Funcion para cerrar sesion (definida antes para usar en useEffect)
  const forceSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {}
    finally {
      setUser(null)
      setProfileSync(null)
      setSession(null)
      setFetchingProfile(false)
      clearSupabaseStorage()
    }
  }, [])

  useEffect(() => {

    // Verificar version de la app antes de obtener la sesion
    const shouldLogout = checkAppVersion()

    if (shouldLogout) {
      // Forzar cierre de sesion por actualizacion de la app
      forceSignOut().then(() => {
        setLoading(false)
        setVersionChecked(true)
      })
      return
    }

    setVersionChecked(true)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {

      // Si el admin recarga la página del panel, limpiar sesión y redirigir a landing
      const isAdminPath = window.location.pathname.startsWith('/admin')
      const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type
      if (session && isAdminPath && navType === 'reload') {
        // Limpiar storage de forma síncrona antes de redirigir
        clearSupabaseStorage()
        // Revocar también en servidor (fire and forget)
        supabase.auth.signOut({ scope: 'global' }).catch(() => {})
        window.location.replace('/')
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Guardar version de sesion si hay sesion activa
        saveSessionVersion()
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Si el evento es SIGNED_OUT, no intentar cargar perfil
      if (_event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfileSync(null)
        setFetchingProfile(false)
        setLoading(false)
        return
      }

      // Solo recargar perfil en ciertos eventos para evitar llamadas innecesarias
      const shouldFetchProfile = _event === 'SIGNED_IN' || _event === 'INITIAL_SESSION' || _event === 'USER_UPDATED'

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        if (shouldFetchProfile) {
          // NO await — Supabase awaits this callback, so awaiting fetchProfile here
          // creates a deadlock: fetchProfile's query waits for initializePromise,
          // which waits for _initialize, which waits for _notifyAllSubscribers,
          // which waits for this callback → 8s timeout. Fire-and-forget breaks it.
          fetchProfile(session.user.id)
        } else {
          // Para eventos como TOKEN_REFRESHED, solo actualizamos la sesión pero no recargamos el perfil
          setLoading(false)
        }
      } else {
        setProfileSync(null)
        setFetchingProfile(false)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [forceSignOut])

  const fetchProfile = async (userId: string) => {
    // Usar ref para evitar stale closure — siempre tiene el valor actual
    if (profileRef.current && profileRef.current.id === userId) {
      setLoading(false)
      return
    }

    // Si hay una fetch en progreso, esperar a que termine y retornar
    if (fetchProfileLockRef.current && currentFetchPromiseRef.current) {
      try {
        await currentFetchPromiseRef.current
      } catch {
        // La promesa anterior falló — continuamos para decidir si reintentar
      }
      setLoading(false)
      return
    }

    // Cancelar cualquier fetch anterior en progreso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Crear nuevo AbortController para esta fetch
    abortControllerRef.current = new AbortController()

    fetchProfileLockRef.current = true
    setFetchingProfile(true)

    // Crear promesa y guardarla para que otras llamadas puedan esperar
    const fetchPromise = (async () => {
      try {
        // Pequeño yield para que Supabase complete la hidratación del token
        // tras redirects externos (Stripe, OAuth). Sin esto el primer query
        // puede salir sin Authorization header antes de que el cliente lo configure.
        await new Promise((r) => setTimeout(r, 80))

        console.log('[Auth] fetchProfile → iniciando query para userId:', userId)

        const profileQuery = supabase.from('profiles').select('*').eq('id', userId).single()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile query timeout after 8s')), 8000)
        )
        const { data, error } = await Promise.race([profileQuery, timeoutPromise]) as Awaited<typeof profileQuery>

        console.log('[Auth] fetchProfile → resultado:', { data: !!data, errorCode: error?.code, errorMsg: error?.message })

        if (error) {
        // Profile doesn't exist - try to create it
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            const userEmail = userData.user.email || ''
            const isAdminEmail = userEmail === 'depuntaachicote@gmail.com'

            // Obtener tipo de usuario de metadata o localStorage (para OAuth)
            let userType: UserType = 'guest'
            if (isAdminEmail) {
              userType = 'guest' // Admin se maneja con el campo role
            } else if (userData.user.user_metadata?.user_type) {
              userType = userData.user.user_metadata.user_type as UserType
            } else {
              // Verificar si hay un tipo pendiente de OAuth
              const pendingUserType = sessionStorage.getItem('dpac_pending_user_type')
              if (pendingUserType === 'host' || pendingUserType === 'guest') {
                userType = pendingUserType
                sessionStorage.removeItem('dpac_pending_user_type')
              }
            }

            // Obtener nombre de Google si viene de OAuth
            const fullName = userData.user.user_metadata?.full_name ||
                            userData.user.user_metadata?.name ||
                            userData.user.user_metadata?.given_name ||
                            ''

            const avatarUrl = userData.user.user_metadata?.avatar_url ||
                             userData.user.user_metadata?.picture ||
                             null


            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: userEmail,
                full_name: fullName,
                company_name: userData.user.user_metadata?.company_name || '',
                role: isAdminEmail ? 'admin' : 'user',
                user_type: isAdminEmail ? 'admin' : userType,
                avatar_url: avatarUrl,
              } as never)
              .select()
              .single()


            if (!insertError && newProfile) {
              setProfileSync(newProfile as Profile)
              saveSessionVersion()
              return
            }
          }
        }
        throw error
        }
        setProfileSync(data)
      } catch (err) {
        const isTimeout = err instanceof Error && err.message.includes('timeout')
        console.warn('[Auth] fetchProfile → excepción capturada:', { isTimeout, msg: err instanceof Error ? err.message : String(err), hasProfile: !!profileRef.current })

        if (isTimeout && profileRef.current) {
          // Timeout transitorio con perfil cargado — mantener sesión
        } else if (!profileRef.current) {
          let recovered: Profile | null = null
          for (const [i, ms] of ([300, 1000] as const).entries()) {
            console.log(`[Auth] fetchProfile → reintento ${i + 1} en ${ms}ms...`)
            try {
              await new Promise((r) => setTimeout(r, ms))
              // @ts-ignore
              const { data } = await Promise.race([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                new Promise<{ data: null }>((r) => setTimeout(() => r({ data: null }), 4000)),
              ])
              console.log(`[Auth] fetchProfile → reintento ${i + 1} resultado:`, { data: !!data })
              if (data) { recovered = data as Profile; break }
            } catch (retryErr) {
              console.warn(`[Auth] fetchProfile → reintento ${i + 1} error:`, retryErr)
            }
          }

          if (recovered) {
            console.log('[Auth] fetchProfile → perfil recuperado en reintento ✓')
            setProfileSync(recovered)
            saveSessionVersion()
          } else {
            const { data: { session: liveSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
            console.warn('[Auth] fetchProfile → todos los intentos fallaron. Sesión activa en Supabase:', !!liveSession)
            setProfileSync(null)
            if (!liveSession) {
              console.warn('[Auth] fetchProfile → sin sesión activa, limpiando storage y deslogueando')
              clearSupabaseStorage()
              supabase.auth.signOut({ scope: 'local' }).catch(() => {})
              setUser(null)
              setSession(null)
            } else {
              console.warn('[Auth] fetchProfile → hay sesión pero perfil no cargó — manteniendo token, redirigiendo a login')
            }
          }
        }
      } finally {
        console.log('[Auth] fetchProfile → finally: setLoading(false)')
        setFetchingProfile(false)
        setLoading(false)
        fetchProfileLockRef.current = false
        currentFetchPromiseRef.current = null
        abortControllerRef.current = null
      }
    })()

    // Guardar la promesa para que otras llamadas puedan esperarla
    currentFetchPromiseRef.current = fetchPromise
    await fetchPromise
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) {
        saveSessionVersion()
      }
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName?: string,
    userType: UserType = 'guest'
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            user_type: userType,
          },
        },
      })

      if (error) throw error

      // Guardar version de sesion al registrarse exitosamente
      saveSessionVersion()

      // Profile is created automatically by the database trigger (handle_new_user)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async (userType: UserType = 'guest') => {
    try {
      // Guardar el tipo de usuario en localStorage para usarlo despues del redirect
      sessionStorage.setItem('dpac_pending_user_type', userType)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {}
    finally {
      setUser(null)
      setProfileSync(null)
      setSession(null)
      setFetchingProfile(false)
      setLoading(false)
      clearSupabaseStorage()
    }
  }

  // Verificar roles - soporta tanto el campo antiguo 'role' como el nuevo 'user_type'
  const isAdmin = profile?.role === 'admin' || profile?.user_type === 'admin'
  const isSuperAdmin = isAdmin && user?.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL
  const isHost = profile?.user_type === 'host'
  const isManager = profile?.user_type === 'manager'
  const isGuest = profile?.user_type === 'guest' || (!isAdmin && !isHost && !isManager)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAdmin,
        isSuperAdmin,
        isHost,
        isGuest,
        isManager,
        appVersion: APP_VERSION,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
