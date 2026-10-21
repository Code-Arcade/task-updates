import React, { useState } from 'react'
import { 
  Database, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Save,
  RotateCcw
} from 'lucide-react'
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey, updateCustomSupabaseConfig } from '../lib/supabase'

export const SettingsView = () => {
  const [url, setUrl] = useState(supabaseUrl || '')
  const [key, setKey] = useState(supabaseAnonKey || '')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveConfig = (e) => {
    e.preventDefault()
    updateCustomSupabaseConfig(url, key)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleResetToDemo = () => {
    updateCustomSupabaseConfig('', '')
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Connection Status Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        isSupabaseConfigured
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/70 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          {isSupabaseConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm">
              {isSupabaseConfigured ? 'Connected to Supabase' : 'Offline / Demo Mode'}
            </h4>
            <p className="text-xs opacity-80 mt-0.5">
              {isSupabaseConfigured
                ? supabaseUrl
                : 'Using local browser storage. Connect Supabase below to sync to cloud.'}
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
          isSupabaseConfigured ? 'bg-emerald-200/60 text-emerald-800' : 'bg-amber-200/60 text-amber-800'
        }`}>
          {isSupabaseConfigured ? 'Live' : 'Demo'}
        </span>
      </div>

      {/* Supabase Credentials Form */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Supabase Configuration</span>
        </h3>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saved! Reloading...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project URL
            </label>
            <input
              type="url"
              placeholder="https://your-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Public Anon Key
            </label>
            <input
              type="text"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
          </div>
        </form>
      </div>

      {/* SQL Setup Quick Reference */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs text-xs text-slate-600 dark:text-slate-400">
        <h4 className="font-bold text-slate-800 dark:text-white mb-1">Database Setup Note</h4>
        <p className="leading-relaxed">
          PostgreSQL schema tables and RLS policies are available in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono font-medium">supabase-schema.sql</code> in the project root. Paste it into the Supabase SQL editor to create the tables.
        </p>
      </div>
    </div>
  )
}
