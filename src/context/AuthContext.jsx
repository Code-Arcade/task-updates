import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin session was established
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('protracker_admin_session') === 'true' : false
    if (storedAdmin) {
      setUser({ id: '00000000-0000-0000-0000-000000000001', email: 'admin@codearcade.com' })
      setProfile({ full_name: 'Admin Lead', role: 'admin' })
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      const storedDemo = localStorage.getItem('demo_auth_active') === 'true'
      if (storedDemo) {
        setUser({ id: 'demo-admin-id', email: 'admin@company.com' })
        setProfile({ full_name: 'Admin User', role: 'admin' })
      }
      setLoading(false)
      return
    }

    // Real Supabase session management
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message)
      }
      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch exception:', err)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    // If logging in as the hardcoded admin, grant immediate authenticated session!
    if (email === 'admin@codearcade.com' && password === 'admin123') {
      const adminUser = { 
        id: '00000000-0000-0000-0000-000000000001', 
        email: 'admin@codearcade.com' 
      }
      setUser(adminUser)
      setProfile({ full_name: 'Admin Lead', role: 'admin' })
      localStorage.setItem('protracker_admin_session', 'true')

      // If Supabase is connected, attempt background sync or signIn
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signInWithPassword({ email, password }).catch(() => {})
      }
      return { data: { user: adminUser }, error: null }
    }

    if (!isSupabaseConfigured || !supabase) {
      setUser({ id: 'admin-id', email })
      setProfile({ full_name: 'Admin Lead', role: 'admin' })
      localStorage.setItem('demo_auth_active', 'true')
      return { data: { user: { email } }, error: null }
    }

    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) {
      setUser({ id: 'demo-admin-id', email })
      setProfile({ full_name: fullName || 'Demo Admin', role: 'admin' })
      localStorage.setItem('demo_auth_active', 'true')
      return { data: { user: { email } }, error: null }
    }
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    return res
  }

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('demo_auth_active')
    localStorage.removeItem('protracker_admin_session')
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
