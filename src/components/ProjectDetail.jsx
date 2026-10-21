import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  Layers,
  Sparkles,
  FileText
} from 'lucide-react'
import { useProjects } from '../context/ProjectsContext'

export const ProjectDetail = ({ projectId, onBack, onEditProject }) => {
  const { projects, addStage, updateStage, deleteStage, reorderStages } = useProjects()
  
  const project = projects.find(p => p.id === projectId)

  // Stage modal / editing state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [stageFormData, setStageFormData] = useState({
    name: '',
    description: '',
    status: 'Not Started',
    due_date: ''
  })
  const [stageFormError, setStageFormError] = useState('')
  const [submittingStage, setSubmittingStage] = useState(false)

  // Delete stage confirmation modal state
  const [stageToDelete, setStageToDelete] = useState(null)

  if (!project) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Project Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested project may have been deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Return to All Projects
        </button>
      </div>
    )
  }

  const stages = project.stages || []
  const completedStages = stages.filter(s => s.status === 'Completed').length

  const getStageStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"/> Completed</span>
      case 'In Progress':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80"><Clock className="w-3.5 h-3.5 text-blue-600"/> In Progress</span>
      case 'Pending':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80"><PauseCircle className="w-3.5 h-3.5 text-amber-600"/> Pending</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300/80"><AlertCircle className="w-3.5 h-3.5 text-slate-500"/> Not Started</span>
    }
  }

  const handleOpenAddStage = () => {
    setEditingStage(null)
    setStageFormData({
      name: '',
      description: '',
      status: 'Not Started',
      due_date: project.due_date || ''
    })
    setStageFormError('')
    setIsStageModalOpen(true)
  }

  const handleOpenEditStage = (stage) => {
    setEditingStage(stage)
    setStageFormData({
      name: stage.name,
      description: stage.description || '',
      status: stage.status || 'Not Started',
      due_date: stage.due_date || ''
    })
    setStageFormError('')
    setIsStageModalOpen(true)
  }

  const handleSaveStage = async (e) => {
    e.preventDefault()
    if (!stageFormData.name.trim()) {
      setStageFormError('Stage name is required')
      return
    }

    setSubmittingStage(true)
    try {
      if (editingStage) {
        await updateStage(editingStage.id, project.id, {
          name: stageFormData.name.trim(),
          description: stageFormData.description.trim(),
          status: stageFormData.status,
          due_date: stageFormData.due_date || null
        })
      } else {
        await addStage(project.id, {
          name: stageFormData.name.trim(),
          description: stageFormData.description.trim(),
          status: stageFormData.status,
          due_date: stageFormData.due_date || null
        })
      }
      setIsStageModalOpen(false)
    } catch (err) {
      setStageFormError(err.message || 'Error saving stage')
    } finally {
      setSubmittingStage(false)
    }
  }

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= stages.length) return

    const newStages = [...stages]
    const temp = newStages[index]
    newStages[index] = newStages[targetIndex]
    newStages[targetIndex] = temp

    await reorderStages(project.id, newStages)
  }

  const handleQuickStatusChange = async (stage, newStatus) => {
    await updateStage(stage.id, project.id, { status: newStatus })
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditProject(project)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Details</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <button
            onClick={handleOpenAddStage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stage</span>
          </button>
        </div>
      </div>

      {/* Project Header Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{project.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                project.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
              }`}>
                {project.status}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-3xl">
              {project.description || 'No description added for this project.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start: <strong className="text-slate-700 dark:text-slate-300">{project.start_date || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Deadline: <strong className="text-slate-700 dark:text-slate-300">{project.due_date || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Stages: <strong className="text-slate-700 dark:text-slate-300">{completedStages}/{stages.length} Completed</strong></span>
              </div>
            </div>
          </div>

          {/* Calculated Progress Gauge */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 w-full lg:w-64 flex flex-col justify-center shrink-0">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium">Calculated Progress</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Auto-calculated from stage completion
            </p>
          </div>
        </div>
      </div>

      {/* Project Stages Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 select-none">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Project Milestone Stages</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stages determine overall project completion and timeline execution
            </p>
          </div>
          <button
            onClick={handleOpenAddStage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Stage</span>
          </button>
        </div>

        {stages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No stages defined yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add custom stages to track progress through every phase of this project.
            </p>
            <button
              onClick={handleOpenAddStage}
              className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Add First Stage
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stages.map((stage, index) => (
              <div 
                key={stage.id} 
                className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Left: Order badge & info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex flex-col items-center gap-1 select-none shrink-0 pt-0.5">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, 'up')}
                        title="Move Up"
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === stages.length - 1}
                        onClick={() => handleMoveOrder(index, 'down')}
                        title="Move Down"
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm break-words">{stage.name}</h4>
                      {getStageStatusBadge(stage.status)}
                    </div>
                    {stage.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl break-words">
                        {stage.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                      {stage.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due: {new Date(stage.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Status dropdown & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <select
                    value={stage.status || 'Not Started'}
                    onChange={(e) => handleQuickStatusChange(stage, e.target.value)}
                    className="text-xs font-medium py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditStage(stage)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Stage"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setStageToDelete(stage)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Stage Modal */}
      {isStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">
                {editingStage ? 'Edit Project Stage' : 'Add New Stage'}
              </h3>
              <button
                onClick={() => setIsStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="p-6 space-y-4">
              {stageFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {stageFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Stage Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Phase, Database Schema, QA Testing"
                  value={stageFormData.name}
                  onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Key deliverables and specifications for this milestone..."
                  value={stageFormData.description}
                  onChange={(e) => setStageFormData({ ...stageFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={stageFormData.status}
                    onChange={(e) => setStageFormData({ ...stageFormData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={stageFormData.due_date}
                    onChange={(e) => setStageFormData({ ...stageFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStage}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingStage ? 'Saving...' : editingStage ? 'Update Stage' : 'Add Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Stage Confirmation Dialog */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Stage?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to delete stage &quot;{stageToDelete.name}&quot;? The project&apos;s progress percentage will be updated accordingly.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setStageToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteStage(stageToDelete.id, project.id)
                  setStageToDelete(null)
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Delete Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
