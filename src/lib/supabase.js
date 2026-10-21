import { createClient } from '@supabase/supabase-js'

// Check environment variables first, then fallback to localStorage if configured via Settings UI
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_key') : null

export const supabaseUrl = envUrl || storedUrl || ''
export const supabaseAnonKey = envAnonKey || storedKey || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project-id')
)

// Create client or fallback safe dummy client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export function updateCustomSupabaseConfig(url, key) {
  if (url && key) {
    localStorage.setItem('custom_supabase_url', url.trim())
    localStorage.setItem('custom_supabase_key', key.trim())
  } else {
    localStorage.removeItem('custom_supabase_url')
    localStorage.removeItem('custom_supabase_key')
  }
  window.location.reload()
}
