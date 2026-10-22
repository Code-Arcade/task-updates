import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, FileText, Layers } from 'lucide-react'

export const ProjectModal = ({ isOpen, onClose, onSave, projectToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'Not Started'
  })

  // Optional initial stages when creating a brand new project
  const [initialStages, setInitialStages] = useState([])
  const [newStageName, setNewStageName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name || '',
        description: projectToEdit.description || '',
        start_date: projectToEdit.start_date || new Date().toISOString().split('T')[0],
        due_date: projectToEdit.due_date || '',
        status: projectToEdit.status || 'Not Started'
      })
      setInitialStages([])
    } else {
      setFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'Not Started'
      })
      setInitialStages([
        { name: 'Planning & Requirements', status: 'Not Started' },
        { name: 'Design & Prototyping', status: 'Not Started' },
        { name: 'Core Development', status: 'Not Started' },
        { name: 'Testing & Launch', status: 'Not Started' }
      ])
    }
    setError('')
  }, [projectToEdit, isOpen])

  if (!isOpen) return null

  const handleAddInitialStage = (e) => {
    e.preventDefault()
    if (!newStageName.trim()) return
    setInitialStages([...initialStages, { name: newStageName.trim(), status: 'Not Started' }])
    setNewStageName('')
  }

  const handleRemoveInitialStage = (index) => {
    setInitialStages(initialStages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        initialStages: !projectToEdit ? initialStages : []
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error saving project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {projectToEdit ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {projectToEdit ? 'Modify project parameters and deadlines' : 'Set up a new project with milestone tracking'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ERP System Migration, Mobile App Redesign"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Explain the scope and primary objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date / Deadline
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project Status (Auto-calculated)
            </label>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                  formData.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}>
                  {formData.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formData.status === 'Completed' ? '100% of milestone stages completed' :
                   formData.status === 'In Progress' ? 'Milestone stages in active progress' :
                   'No milestone stages started yet'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                Read-Only
              </span>
            </div>
          </div>

          {/* Initial Stages Setup (Only when creating a new project) */}
          {!projectToEdit && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Custom Milestone Stages ({initialStages.length})
              </label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                Stages help break down this project. You can add or reorder more stages anytime later.
              </p>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mb-2.5">
                {initialStages.map((st, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{i + 1}. {st.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInitialStage(i)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add another stage..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddInitialStage(e)
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-blue-500 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddInitialStage}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-95"
            >
              {submitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

