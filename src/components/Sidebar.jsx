import React from 'react'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  LogOut, 
  Layers, 
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const { user, profile, signOut, isSupabaseConfigured } = useAuth()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'All Projects', icon: FolderKanban },
    { id: 'settings', label: 'Settings & Supabase', icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Navy-blue professional Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-xl`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-[#0a0f1d]">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide text-base leading-tight">ProTracker</div>
            <div className="text-[11px] text-blue-400 font-medium">Enterprise Dashboard</div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id || (activeTab === 'project-detail' && item.id === 'projects')
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
              </button>
            )
          })}

          {/* Database connection badge */}
          <div className="pt-6 px-2">
            <div className={`p-3 rounded-lg border text-xs ${
              isSupabaseConfigured 
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' 
                : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
            }`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Local Mode'}</span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {isSupabaseConfigured 
                  ? 'Connected to live PostgreSQL database.' 
                  : 'Configure Supabase keys in Settings to connect cloud DB.'}
              </p>
            </div>
          </div>
        </div>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a0f1d]/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs border border-slate-600">
              {(profile?.full_name || user?.email || 'Admin')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'Admin User'}
              </p>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                {user?.email || 'admin@company.com'}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-900/40 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
