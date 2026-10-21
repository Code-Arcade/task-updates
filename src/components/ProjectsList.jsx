import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react'
import { useProjects } from '../context/ProjectsContext'

export const ProjectsList = ({ onSelectProject, onOpenNewProject, onEditProject, onDeleteProject }) => {
  const { projects } = useProjects()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"/> Completed</span>
      case 'In Progress':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80"><Clock className="w-3.5 h-3.5 text-blue-600"/> In Progress</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300/80"><AlertCircle className="w-3.5 h-3.5 text-slate-500"/> Not Started</span>
    }
  }

  return (
    <div className="space-y-5">
      {/* Search and Filter */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All ({projects.length})</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
        </div>

        <button
          onClick={onOpenNewProject}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No projects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs card-hover p-5 flex flex-col justify-between cursor-pointer group hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md relative overflow-hidden"
            >
              {/* Top Accent bar based on status */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                project.status === 'Completed' ? 'bg-emerald-500' :
                project.status === 'In Progress' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`} />
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1" title={project.name}>
                    {project.name}
                  </h4>
                  {getStatusBadge(project.status)}
                </div>

                {project.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span>Progress</span>
                    <span className="font-bold text-slate-900 dark:text-white">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        project.progress === 100
                          ? 'bg-emerald-500'
                          : project.progress > 40
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'No date'}
                  </span>
                  <span>{project.stages?.length || 0} stages</span>
                </div>
              </div>

              {/* Actions */}
              <div 
                className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                >
                  View Details
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditProject(project)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProject(project)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete"
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
  )
}
