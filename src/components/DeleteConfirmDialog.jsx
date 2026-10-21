import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

export const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, project, loading }) => {
  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Delete Project?</h3>
        <p className="text-xs text-slate-500 mb-2">
          Are you sure you want to permanently delete <strong className="text-slate-800">&quot;{project.name}&quot;</strong>?
        </p>
        <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 mb-5">
          Notice: All associated milestone stages ({project.stages?.length || 0} stages) will also be deleted.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
