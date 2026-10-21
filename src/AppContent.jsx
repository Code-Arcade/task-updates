import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { DashboardView } from './components/DashboardView'
import { ProjectsList } from './components/ProjectsList'
import { ProjectDetail } from './components/ProjectDetail'
import { SettingsView } from './components/SettingsView'
import { ProjectModal } from './components/ProjectModal'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import { AuthModal } from './components/AuthModal'
import { useAuth } from './context/AuthContext'
import { useProjects } from './context/ProjectsContext'

export function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { createProject, updateProject, deleteProject } = useProjects()

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Project Modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState(null)

  // Delete Dialog state
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Auth Modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const handleOpenNewProject = () => {
    setProjectToEdit(null)
    setIsProjectModalOpen(true)
  }

  const handleOpenEditProject = (project) => {
    setProjectToEdit(project)
    setIsProjectModalOpen(true)
  }

  const handleSaveProject = async (projectData) => {
    if (projectToEdit) {
      await updateProject(projectToEdit.id, projectData)
    } else {
      const res = await createProject(projectData)
      if (res?.data?.id) {
        // Optionally jump to detail view
        setSelectedProjectId(res.data.id)
        setActiveTab('project-detail')
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    try {
      await deleteProject(projectToDelete.id)
      if (selectedProjectId === projectToDelete.id) {
        setSelectedProjectId(null)
        setActiveTab('projects')
      }
      setProjectToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId)
    setActiveTab('project-detail')
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview'
      case 'projects':
        return 'All Projects'
      case 'project-detail':
        return 'Project Breakdown'
      case 'settings':
        return 'Settings & Supabase'
      default:
        return 'Project Tracker'
    }
  }

  // If user is not signed in and has no session, show clean gatekeeper
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-100/90 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden lg:pl-64">
        {/* Top Navbar */}
        <Navbar
          title={getPageTitle()}
          setIsMobileOpen={setIsMobileOpen}
          onOpenNewProject={handleOpenNewProject}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectProject={handleSelectProject}
              onOpenNewProject={handleOpenNewProject}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsList
              onSelectProject={handleSelectProject}
              onOpenNewProject={handleOpenNewProject}
              onEditProject={handleOpenEditProject}
              onDeleteProject={(p) => setProjectToDelete(p)}
            />
          )}

          {activeTab === 'project-detail' && (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setActiveTab('projects')}
              onEditProject={handleOpenEditProject}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Project Create / Edit Dialog */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        project={projectToDelete}
        loading={deleting}
      />

      {/* Explicit Auth Modal if needed */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  )
}
