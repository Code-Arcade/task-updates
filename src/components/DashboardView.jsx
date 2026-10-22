import React from 'react'
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  Plus
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
  CartesianGrid, 
  Legend 
} from 'recharts'
import { useProjects } from '../context/ProjectsContext'

export const DashboardView = ({ onSelectProject, onOpenNewProject }) => {
  const { projects, loading } = useProjects()

  // Calculate statistics from actual database records
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === 'Completed').length
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length
  const notStartedProjects = projects.filter(p => p.status === 'Not Started').length

  const overallCompletionPercentage = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
    : 0

  // Chart data for Donut Chart (Status distribution)
  const donutData = [
    { name: 'Completed', value: completedProjects, color: '#10b981' },
    { name: 'In Progress', value: inProgressProjects, color: '#3b82f6' },
    { name: 'Not Started', value: notStartedProjects, color: '#94a3b8' },
  ].filter(d => d.value > 0)

  // Chart data for Bar Chart (Top recent projects progress)
  const barData = projects.slice(0, 7).map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    fullName: p.name,
    progress: p.progress || 0,
    stagesCount: p.stages?.length || 0
  }))

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Completed</span>
      case 'In Progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Not Started</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Key Stat Cards - Clean elevated card style inspired by reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Projects */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl soft-card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Projects</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalProjects}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 hidden xs:block">Across all workspaces</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 self-end sm:self-auto border border-blue-100 dark:border-blue-900/40">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl soft-card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedProjects}</h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
              {totalProjects > 0 ? `${Math.round((completedProjects / totalProjects) * 100)}% done` : '0%'}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 self-end sm:self-auto border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl soft-card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{inProgressProjects}</h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-semibold rounded-full border border-blue-200/60 dark:border-blue-800/60">
              Active sprints
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 self-end sm:self-auto border border-blue-100 dark:border-blue-900/40">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Not Started */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl soft-card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Not Started</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">{notStartedProjects}</h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full border border-slate-200 dark:border-slate-700">
              Backlog queue
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 self-end sm:self-auto border border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Overall Progress Banner with Soft Floating Container */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#162033] to-[#1e293b] p-5 sm:p-7 rounded-2xl text-white soft-card flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-800 max-w-full">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-400/20 rounded-full text-blue-400 text-xs font-semibold tracking-wide">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>PORTFOLIO HEALTH</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mt-2 text-white tracking-tight">Enterprise Delivery Metrics</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            Aggregated progress computed automatically across {totalProjects} projects and active milestone stages.
          </p>
        </div>
        <div className="w-full md:w-80 bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 shadow-inner">
          <div className="flex justify-between items-center text-xs mb-2.5">
            <span className="text-slate-300 font-medium">Average Completion</span>
            <span className="text-base sm:text-lg font-bold text-blue-400">{overallCompletionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-700/80 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${overallCompletionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Section: Donut Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 max-w-full">
        {/* Donut Chart: Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 soft-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Status Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Breakdown of projects by lifecycle state</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [`${val} projects`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No project data available for chart
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Completed ({completedProjects})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-300">In Progress ({inProgressProjects})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">Not Started ({notStartedProjects})</span>
            </div>
          </div>
        </div>

        {/* Bar Chart: Project Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 soft-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Project Progress Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Milestone completion percentage per project</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200/80 dark:border-slate-700">
              Top Active
            </span>
          </div>

          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    unit="%"
                  />
                  <Tooltip 
                    formatter={(val) => [`${val}%`, 'Progress']}
                    labelFormatter={(name, payload) => payload?.[0]?.payload?.fullName || name}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                No active projects to display in chart
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Quick Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 soft-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Projects Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live progress tracking and deadlines</p>
          </div>
          {onOpenNewProject && (
            <button
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all self-start sm:self-auto cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">No projects found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first corporate project with custom milestone stages.
            </p>
            {onOpenNewProject && (
              <button
                onClick={onOpenNewProject}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full -mx-px">
            <table className="w-full min-w-[550px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Project Name</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Progress</th>
                  <th className="py-3 px-5">Stages</th>
                  <th className="py-3 px-5">Deadline</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{project.name}</div>
                      <div className="text-slate-400 dark:text-slate-500 truncate max-w-xs">{project.description || 'No description provided'}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="w-36">
                        <div className="flex justify-between items-center mb-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <span>{project.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              project.progress === 100 
                                ? 'bg-emerald-500' 
                                : project.progress > 50 
                                ? 'bg-blue-600' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{project.stages?.length || 0}</span> stages
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'None set'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectProject(project.id)
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1 px-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
