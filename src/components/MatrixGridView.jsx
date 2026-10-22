import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Plus, 
  CheckSquare, 
  Square, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  MoreVertical
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts'
import { useProjects } from '../context/ProjectsContext'

export const MatrixGridView = ({ onOpenNewProject, onSelectProject }) => {
  const { projects, toggleTaskCheck, insertGlobalTask, renameGlobalTask, deleteGlobalTask } = useProjects()

  // New task form state
  const [newTaskName, setNewTaskName] = useState('')
  const [afterTask, setAfterTask] = useState('')
  const [isInserting, setIsInserting] = useState(false)
  const [activeCellUpdating, setActiveCellUpdating] = useState(null)

  // Context Menu State for Column Headers
  const [contextMenu, setContextMenu] = useState(null) // { x, y, colName, colIndex }
  const [renameModal, setRenameModal] = useState(null) // { colName, newName }
  const contextMenuRef = useRef(null)

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Custom task columns that persist even when no project exists yet
  const [customColumns, setCustomColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('protracker_custom_columns')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Derive unique task columns across all projects + user inserted columns
  const taskColumns = useMemo(() => {
    // 1. Gather all unique columns
    const allKnown = new Set()
    projects.forEach(p => {
      (p.stages || []).forEach(s => {
        if (s.name) allKnown.add(s.name.trim())
      })
    })
    customColumns.forEach(c => allKnown.add(c.trim()))

    // 2. Preserve order specified by customColumns first, then any extra discovered
    const ordered = []
    customColumns.forEach(c => {
      const trimmed = c.trim()
      if (allKnown.has(trimmed) && !ordered.includes(trimmed)) {
        ordered.push(trimmed)
      }
    })
    allKnown.forEach(name => {
      if (!ordered.includes(name)) {
        ordered.push(name)
      }
    })

    if (ordered.length === 0) {
      return Array.from({ length: 12 }, (_, i) => `Task ${i + 1}`)
    }
    return ordered
  }, [projects, customColumns])

  // Save updated ordered columns
  const persistColumns = (newCols) => {
    setCustomColumns(newCols)
    try {
      localStorage.setItem('protracker_custom_columns', JSON.stringify(newCols))
    } catch (err) {
      console.error('Error saving columns to localStorage:', err)
    }
  }

  // Handle right-click on column header
  const handleColumnContextMenu = (e, colName, colIndex) => {
    e.preventDefault()
    e.stopPropagation()
    // Position menu within viewport
    const clickX = e.clientX
    const clickY = e.clientY
    const menuWidth = 190
    const menuHeight = 180
    const x = clickX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : clickX
    const y = clickY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : clickY

    setContextMenu({
      x,
      y,
      colName,
      colIndex
    })
  }

  // Move column left or right
  const handleMoveColumn = (direction) => {
    if (!contextMenu) return
    const { colIndex } = contextMenu
    const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1
    if (targetIndex < 0 || targetIndex >= taskColumns.length) return

    const newCols = [...taskColumns]
    const temp = newCols[colIndex]
    newCols[colIndex] = newCols[targetIndex]
    newCols[targetIndex] = temp

    persistColumns(newCols)
    setContextMenu(null)
  }

  // Delete column
  const handleDeleteColumn = async () => {
    if (!contextMenu) return
    const { colName } = contextMenu
    if (!window.confirm(`Are you sure you want to delete column "${colName}" across all projects?`)) {
      setContextMenu(null)
      return
    }

    const newCols = taskColumns.filter(c => c.toLowerCase() !== colName.toLowerCase())
    persistColumns(newCols)
    await deleteGlobalTask(colName)
    setContextMenu(null)
  }

  // Open rename modal
  const handleOpenRename = () => {
    if (!contextMenu) return
    setRenameModal({
      colName: contextMenu.colName,
      newName: contextMenu.colName
    })
    setContextMenu(null)
  }

  // Submit rename
  const handleSubmitRename = async (e) => {
    e.preventDefault()
    if (!renameModal || !renameModal.newName.trim()) return
    const oldName = renameModal.colName.trim()
    const newName = renameModal.newName.trim()

    if (oldName === newName) {
      setRenameModal(null)
      return
    }

    const newCols = taskColumns.map(c => c.toLowerCase() === oldName.toLowerCase() ? newName : c)
    persistColumns(newCols)
    await renameGlobalTask(oldName, newName)
    setRenameModal(null)
  }

  // Get remark based on progress
  const getProgressRemark = (progress) => {
    if (progress === 100) return { text: 'Completed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' }
    if (progress >= 75) return { text: 'Almost Done', color: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800' }
    if (progress >= 50) return { text: 'On Track', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' }
    if (progress > 0) return { text: 'In Progress', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' }
    return { text: 'Not Started', color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' }
  }

  // Handle cell click
  const handleToggle = async (projectId, taskName, isCompleted) => {
    const key = `${projectId}-${taskName}`
    setActiveCellUpdating(key)
    try {
      await toggleTaskCheck(projectId, taskName, isCompleted)
    } finally {
      setActiveCellUpdating(null)
    }
  }

  // Handle Insert New Task
  const handleInsertTask = async (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return
    const name = newTaskName.trim()
    setIsInserting(true)
    try {
      // 1. Insert into persistent column state
      const updated = [...taskColumns]
      if (!updated.includes(name)) {
        if (afterTask && updated.includes(afterTask)) {
          const idx = updated.indexOf(afterTask)
          updated.splice(idx + 1, 0, name)
        } else {
          updated.push(name)
        }
      }
      persistColumns(updated)

      // 2. Also attach to any existing projects
      await insertGlobalTask(name, afterTask)
      setNewTaskName('')
    } finally {
      setIsInserting(false)
    }
  }

  // Summary Metrics calculations
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.progress === 100).length
  const almostDoneProjects = projects.filter(p => p.progress >= 75 && p.progress < 100).length
  const onTrackProjects = projects.filter(p => p.progress >= 50 && p.progress < 75).length
  const inProgressProjects = projects.filter(p => p.progress > 0 && p.progress < 50).length
  const notStartedProjects = projects.filter(p => !p.progress || p.progress === 0).length

  const pendingProjects = almostDoneProjects + inProgressProjects

  const avgProgress = totalProjects > 0
    ? (projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects).toFixed(2)
    : '0.00'

  // Task count aggregation across all rows
  let totalTasksCount = 0
  let completedTasksCount = 0
  projects.forEach(p => {
    const stages = p.stages || []
    totalTasksCount += stages.length
    completedTasksCount += stages.filter(s => s.status === 'Completed').length
  })
  // If no explicit stages yet, extrapolate standard columns count
  if (totalTasksCount === 0 && totalProjects > 0) {
    totalTasksCount = totalProjects * taskColumns.length
  }
  const pendingTasksCount = Math.max(0, totalTasksCount - completedTasksCount)
  const taskCompletionPercentage = totalTasksCount > 0 
    ? ((completedTasksCount / totalTasksCount) * 100).toFixed(2) 
    : '0.00'
  const taskPendingPercentage = totalTasksCount > 0 
    ? ((pendingTasksCount / totalTasksCount) * 100).toFixed(2) 
    : '0.00'

  // Donut Chart data: Project Progress Overview
  const progressDonutData = [
    { name: 'Completed (100%)', value: completedProjects, color: '#16a34a' },
    { name: 'Almost Done (75%-99%)', value: almostDoneProjects, color: '#4ade80' },
    { name: 'On Track (50%-74%)', value: onTrackProjects, color: '#2563eb' },
    { name: 'In Progress (1%-49%)', value: inProgressProjects, color: '#f59e0b' },
    { name: 'Not Started (0%)', value: notStartedProjects, color: '#ef4444' }
  ].filter(d => d.value > 0)

  // Vertical Bar Chart data: Projects by Status
  const statusChartData = [
    { name: 'Completed', count: completedProjects, fill: '#16a34a' },
    { name: 'Almost Done', count: almostDoneProjects, fill: '#4ade80' },
    { name: 'On Track', count: onTrackProjects, fill: '#2563eb' },
    { name: 'In Progress', count: inProgressProjects, fill: '#f59e0b' },
    { name: 'Not Started', count: notStartedProjects, fill: '#ef4444' }
  ]

  // Horizontal Bar Chart data: Task Completion Overview
  const horizontalTaskData = [
    { name: 'Total Tasks', value: totalTasksCount, fill: '#2563eb', label: `${totalTasksCount}` },
    { name: 'Completed Tasks', value: completedTasksCount, fill: '#16a34a', label: `${completedTasksCount} (${taskCompletionPercentage}%)` },
    { name: 'Pending Tasks', value: pendingTasksCount, fill: '#f59e0b', label: `${pendingTasksCount} (${taskPendingPercentage}%)` }
  ]

  return (
    <div className="space-y-8 max-w-full overflow-x-hidden">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & ACTION BUTTONS                                 */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <button
          onClick={onOpenNewProject}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#0f2343] hover:bg-[#163564] rounded-md shadow-sm transition-all cursor-pointer tracking-wider uppercase active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Project</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-[#0f2343] dark:text-white tracking-widest text-center uppercase">
          PROJECT MASTER
        </h1>

        <button
          onClick={() => {
            const input = document.getElementById('new-task-input')
            if (input) input.focus()
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#15803d] hover:bg-[#16a34a] rounded-md shadow-sm transition-all cursor-pointer tracking-wider uppercase active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Insert New Task</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN SPREADSHEET MATRIX TABLE & INSERT TASK SIDE CARD       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* The Matrix Spreadsheet Table */}
        <div className="xl:col-span-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse text-xs text-center">
              <thead>
                <tr className="bg-[#0f2343] text-white font-bold tracking-wider divide-x divide-slate-700/60 text-[11px]">
                  <th className="py-2.5 px-4 text-left font-bold min-w-[150px] sticky left-0 bg-[#0f2343] z-10 shadow-xs">
                    Items
                  </th>
                  {taskColumns.map((colName, idx) => (
                    <th 
                      key={idx} 
                      onContextMenu={(e) => handleColumnContextMenu(e, colName, idx)}
                      className="py-2.5 px-2 font-bold min-w-[75px] whitespace-nowrap cursor-context-menu select-none relative group hover:bg-[#1a386b] transition-colors"
                      title="Right-click for Rename, Delete, Move options"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{colName}</span>
                        <button
                          type="button"
                          onClick={(e) => handleColumnContextMenu(e, colName, idx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-white/20 text-white/80 transition-opacity cursor-pointer"
                          title="Column options"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-bold min-w-[100px] whitespace-nowrap">
                    Progress (%)
                  </th>
                  <th className="py-2.5 px-4 font-bold min-w-[120px] whitespace-nowrap">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={taskColumns.length + 3} className="py-12 text-center text-slate-400">
                      No projects currently added. Click <strong>+ ADD NEW PROJECT</strong> above to create your first row!
                    </td>
                  </tr>
                ) : (
                  projects.map((project, pIndex) => {
                    const rowProgress = project.progress !== undefined ? project.progress : 0
                    const remark = getProgressRemark(rowProgress)

                    return (
                      <tr 
                        key={project.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 divide-x divide-slate-200 dark:divide-slate-800 transition-colors ${
                          pIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        {/* Project / Item Title (Sticky Column) */}
                        <td 
                          onClick={() => onSelectProject(project.id)}
                          className="py-2.5 px-4 text-left font-semibold text-slate-900 dark:text-white sticky left-0 bg-inherit z-10 shadow-xs cursor-pointer hover:text-blue-600 transition-colors whitespace-nowrap"
                          title="Click to view full project breakdown"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{project.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-40 text-slate-400 shrink-0" />
                          </div>
                        </td>

                        {/* Interactive Task Checkboxes */}
                        {taskColumns.map((colName, cIndex) => {
                          const existingStage = (project.stages || []).find(
                            s => s.name.trim().toLowerCase() === colName.trim().toLowerCase()
                          )
                          const isCompleted = existingStage?.status === 'Completed'
                          const cellKey = `${project.id}-${colName}`
                          const isUpdating = activeCellUpdating === cellKey

                          return (
                            <td 
                              key={cIndex}
                              onClick={() => handleToggle(project.id, colName, isCompleted)}
                              className="py-2 px-2 text-center cursor-pointer select-none hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 transition-colors"
                              title={`${project.name} - ${colName}: Click to toggle`}
                            >
                              <div className="flex items-center justify-center">
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                ) : isCompleted ? (
                                  <div className="w-5 h-5 bg-[#16a34a] text-white rounded-xs flex items-center justify-center shadow-xs">
                                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-800 hover:border-slate-400" />
                                )}
                              </div>
                            </td>
                          )
                        })}

                        {/* Progress (%) */}
                        <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {rowProgress}%
                        </td>

                        {/* Remarks */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[11px] font-semibold border ${remark.color}`}>
                            {remark.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Insert New Task Card */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg shadow-sm p-4 text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3">
            Insert New Task
          </h3>
          <form onSubmit={handleInsertTask} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Task Name
              </label>
              <input
                id="new-task-input"
                type="text"
                required
                placeholder="Enter Task Name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                After Task
              </label>
              <select
                value={afterTask}
                onChange={(e) => setAfterTask(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="">End of list</option>
                {taskColumns.map((col, idx) => (
                  <option key={idx} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isInserting || !newTaskName.trim()}
              className="w-full py-2 px-3 text-xs font-bold text-white bg-[#0f2343] hover:bg-[#163564] rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer tracking-wider uppercase active:scale-95 mt-1"
            >
              {isInserting ? 'INSERTING...' : 'INSERT'}
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SUMMARY DASHBOARD - 6 KPI CARDS IN A SINGLE ROW             */}
      {/* ============================================================== */}
      <div className="space-y-4 pt-2">
        <div className="inline-block px-4 py-1.5 bg-[#0f2343] text-white text-xs font-bold tracking-wider uppercase rounded-sm">
          SUMMARY DASHBOARD
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL PROJECTS</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalProjects}</h4>
            </div>
          </div>

          {/* 2. Completed Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">COMPLETED</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{completedProjects}</span>
                <span className="text-[11px] font-bold text-emerald-600">
                  ({totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 3. In Progress Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
              <div className="flex flex-col gap-1 w-4">
                <span className="h-0.5 bg-white w-full rounded-sm" />
                <span className="h-0.5 bg-white w-3/4 rounded-sm" />
                <span className="h-0.5 bg-white w-full rounded-sm" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IN PROGRESS</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{inProgressProjects}</span>
                <span className="text-[11px] font-bold text-blue-600">
                  ({totalProjects > 0 ? Math.round((inProgressProjects / totalProjects) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 4. Pending Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 7v5l3 2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PENDING</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{pendingProjects}</span>
                <span className="text-[11px] font-bold text-amber-600">
                  ({totalProjects > 0 ? Math.round((pendingProjects / totalProjects) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 5. Not Started Projects */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NOT STARTED</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{notStartedProjects}</span>
                <span className="text-[11px] font-bold text-rose-600">
                  ({totalProjects > 0 ? Math.round((notStartedProjects / totalProjects) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 6. Average Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AVERAGE PROGRESS</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{avgProgress}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. VISUAL ANALYTICS - 4 CHARTS SIDE BY SIDE                    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chart 1: Project Progress Overview (Multi-Color Donut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2">
            Project Progress Overview
          </h4>
          <div className="h-44 relative flex items-center justify-center">
            {progressDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {progressDonutData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [`${val} Projects`, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No project data</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 dark:text-white">{totalProjects}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Completed (100%)</span>
              <span className="font-bold">{completedProjects}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4ade80]" /> Almost Done (75%-99%)</span>
              <span className="font-bold">{almostDoneProjects}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563eb]" /> On Track (50%-74%)</span>
              <span className="font-bold">{onTrackProjects}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> In Progress (1%-49%)</span>
              <span className="font-bold">{inProgressProjects}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Not Started (0%)</span>
              <span className="font-bold">{notStartedProjects}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Projects by Status (Vertical Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2">
            Projects by Status
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9, fill: '#64748b' }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val) => [`${val} projects`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Overall Task Progress (Radial Ring Progress) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between items-center text-center">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-white self-start mb-2">
            Overall Task Progress
          </h4>
          <div className="h-44 w-44 relative flex items-center justify-center my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: parseFloat(avgProgress) || 0, fill: '#2563eb' },
                    { name: 'Remaining', value: Math.max(0, 100 - (parseFloat(avgProgress) || 0)), fill: '#e2e8f0' }
                  ]}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={55}
                  outerRadius={70}
                  dataKey="value"
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#e2e8f0" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900 dark:text-white">{avgProgress}%</span>
              <span className="text-[10px] text-slate-400 font-medium">- Average Progress -</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Computed across all active milestone stages
          </p>
        </div>

        {/* Chart 4: Task Completion Overview (Horizontal Stacked Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2">
            Task Completion Overview
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={horizontalTaskData}
                margin={{ top: 10, right: 30, left: 35, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 9, fill: '#64748b' }}
                />
                <Tooltip 
                  formatter={(val, name, item) => [item.payload.label, item.payload.name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {horizontalTaskData.map((entry, index) => (
                    <Cell key={`hbar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. HELPER INFO BANNER (Matching bottom reference note)         */}
      {/* ============================================================== */}
      <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 p-3 rounded-lg flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-300">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <p>
          <strong>Tip:</strong> Right-click on any task column header to <strong>Rename</strong>, <strong>Delete</strong>, or <strong>Move</strong> it. Progress (%) is auto calculated based on completed tasks.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 6. RIGHT-CLICK CONTEXT MENU                                    */}
      {/* ============================================================== */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {contextMenu.colName}
          </div>

          {/* Rename */}
          <button
            type="button"
            onClick={handleOpenRename}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Rename Column</span>
          </button>

          {/* Move Left */}
          <button
            type="button"
            disabled={contextMenu.colIndex === 0}
            onClick={() => handleMoveColumn('left')}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Move Left</span>
          </button>

          {/* Move Right */}
          <button
            type="button"
            disabled={contextMenu.colIndex === taskColumns.length - 1}
            onClick={() => handleMoveColumn('right')}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Move Right</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Column</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. RENAME MODAL DIALOG                                         */}
      {/* ============================================================== */}
      {renameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Rename Column
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a new name for <strong>{renameModal.colName}</strong> across all projects:
            </p>

            <form onSubmit={handleSubmitRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={renameModal.newName}
                onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameModal.newName.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
