import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  // undefined = ачаалж байна, null = profile олдсонгүй
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id

  const fetchProfile = useCallback(async () => {
    if (!uid) return
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data ?? null)
  }, [uid])

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      return
    }
    setProfile(undefined)
    fetchProfile()
  }, [uid, fetchProfile])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile: profile ?? null,
      isAdmin: profile?.role === 'admin',
      loading: authLoading || (!!uid && profile === undefined),
      refreshProfile: fetchProfile,
      signUp: (email, password, fullName) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
      sendResetEmail: (email) =>
        supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }),
      updatePassword: (password) => supabase.auth.updateUser({ password }),
    }),
    [session, profile, authLoading, uid, fetchProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth нь AuthProvider дотор ашиглагдах ёстой')
  return ctx
}
