import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ProjectsContext = createContext(null)

const INITIAL_DEMO_PROJECTS = [
  {
    id: 'demo-p-1',
    name: 'Website Redesign & Brand Revamp',
    description: 'Modernizing corporate web portal and upgrading UI components to React and Tailwind CSS.',
    status: 'In Progress',
    start_date: '2026-03-01',
    due_date: '2026-11-15',
    progress: 60,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    stages: [
      { id: 's1', project_id: 'demo-p-1', name: 'Design System & Figma Mockups', description: 'Create tokens and component library', status: 'Completed', due_date: '2026-04-10', display_order: 1 },
      { id: 's2', project_id: 'demo-p-1', name: 'Frontend Architecture & Routing', description: 'Setup Vite, Tailwind, and layout shells', status: 'Completed', due_date: '2026-05-20', display_order: 2 },
      { id: 's3', project_id: 'demo-p-1', name: 'Dashboard & Analytics Integration', description: 'Build interactive Recharts and real-time updates', status: 'Completed', due_date: '2026-07-15', display_order: 3 },
      { id: 's4', project_id: 'demo-p-1', name: 'Supabase Database Migration', description: 'Setup RLS rules and Postgres tables', status: 'In Progress', due_date: '2026-10-30', display_order: 4 },
      { id: 's5', project_id: 'demo-p-1', name: 'End-to-End QA & Launch', description: 'User acceptance tests and production deployment', status: 'Pending', due_date: '2026-11-15', display_order: 5 }
    ]
  },
  {
    id: 'demo-p-2',
    name: 'Mobile App API v2',
    description: 'Developing high-throughput REST and GraphQL endpoints with JWT authentication.',
    status: 'Completed',
    start_date: '2026-01-10',
    due_date: '2026-08-30',
    progress: 100,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    stages: [
      { id: 's6', project_id: 'demo-p-2', name: 'API Specification & Swagger', description: 'Document contracts and endpoints', status: 'Completed', due_date: '2026-02-15', display_order: 1 },
      { id: 's7', project_id: 'demo-p-2', name: 'Core Microservices Dev', description: 'Implement authentication and data access layer', status: 'Completed', due_date: '2026-05-15', display_order: 2 },
      { id: 's8', project_id: 'demo-p-2', name: 'Load Testing & Prod Rollout', description: 'Stress test 10k req/sec', status: 'Completed', due_date: '2026-08-30', display_order: 3 }
    ]
  },
  {
    id: 'demo-p-3',
    name: 'Customer Portal Security Audit',
    description: 'Penetration testing and ISO 27001 compliance verification for enterprise clients.',
    status: 'Not Started',
    start_date: '2026-11-01',
    due_date: '2026-12-20',
    progress: 0,
    created_at: new Date().toISOString(),
    stages: [
      { id: 's9', project_id: 'demo-p-3', name: 'Scope Definition', description: 'Identify target IPs and service accounts', status: 'Not Started', due_date: '2026-11-05', display_order: 1 },
      { id: 's10', project_id: 'demo-p-3', name: 'Automated Vulnerability Scan', description: 'Run SAST and DAST scanners', status: 'Not Started', due_date: '2026-11-18', display_order: 2 },
      { id: 's11', project_id: 'demo-p-3', name: 'Remediation & Final Report', description: 'Patch findings and present executive audit summary', status: 'Not Started', due_date: '2026-12-20', display_order: 3 }
    ]
  }
]

export const ProjectsProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Compute progress for a project based on its stages
  const calculateProgressFromStages = (stages = []) => {
    if (!stages || stages.length === 0) return 0
    const completedCount = stages.filter(s => s.status === 'Completed').length
    return Math.round((completedCount / stages.length) * 100)
  }

  // Fetch all projects and their stages
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured || !supabase) {
      // Use local storage demo store
      const local = localStorage.getItem('app_projects_data')
      if (local) {
        try {
          setProjects(JSON.parse(local))
        } catch {
          setProjects(INITIAL_DEMO_PROJECTS)
          localStorage.setItem('app_projects_data', JSON.stringify(INITIAL_DEMO_PROJECTS))
        }
      } else {
        setProjects(INITIAL_DEMO_PROJECTS)
        localStorage.setItem('app_projects_data', JSON.stringify(INITIAL_DEMO_PROJECTS))
      }
      setLoading(false)
      return
    }

    try {
      // Fetch projects
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projError) throw projError

      // Fetch stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .order('display_order', { ascending: true })

      if (stagesError) throw stagesError

      // Combine projects with their stages & calculate accurate progress
      const projectsWithStages = (projectsData || []).map(p => {
        const pStages = (stagesData || [])
          .filter(s => s.project_id === p.id)
          .sort((a, b) => a.display_order - b.display_order)
        
        const computedProgress = pStages.length > 0 ? calculateProgressFromStages(pStages) : (p.progress || 0)
        
        // Auto derive status if 100% completed or stages determine it
        let computedStatus = p.status
        if (pStages.length > 0) {
          if (computedProgress === 100) {
            computedStatus = 'Completed'
          } else if (computedProgress > 0) {
            computedStatus = 'In Progress'
          }
        }

        return {
          ...p,
          progress: computedProgress,
          status: computedStatus,
          stages: pStages
        }
      })

      setProjects(projectsWithStages)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Sync to localStorage in demo mode
  const syncLocal = (newProjects) => {
    setProjects(newProjects)
    localStorage.setItem('app_projects_data', JSON.stringify(newProjects))
  }

  // 1. Create Project
  const createProject = async ({ name, description, start_date, due_date, status = 'Not Started', initialStages = [] }) => {
    setError(null)
    if (!isSupabaseConfigured || !supabase) {
      const newProjectId = 'proj-' + Date.now()
      const formattedStages = initialStages.map((s, idx) => ({
        id: 'stage-' + Date.now() + '-' + idx,
        project_id: newProjectId,
        name: s.name,
        description: s.description || '',
        status: s.status || 'Not Started',
        due_date: s.due_date || due_date,
        display_order: idx + 1
      }))

      const progress = calculateProgressFromStages(formattedStages)
      const newProject = {
        id: newProjectId,
        name,
        description,
        start_date: start_date || new Date().toISOString().split('T')[0],
        due_date,
        status: progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : status),
        progress,
        created_at: new Date().toISOString(),
        stages: formattedStages
      }

      const updated = [newProject, ...projects]
      syncLocal(updated)
      return { data: newProject, error: null }
    }

    try {
      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .insert([
          {
            name,
            description,
            start_date: start_date || new Date().toISOString().split('T')[0],
            due_date,
            status,
            progress: 0,
            user_id: user?.id || null
          }
        ])
        .select()
        .single()

      if (projErr) throw projErr

      // Insert stages if any
      if (initialStages && initialStages.length > 0) {
        const stageRows = initialStages.map((s, idx) => ({
          project_id: projectData.id,
          name: s.name,
          description: s.description || '',
          status: s.status || 'Not Started',
          due_date: s.due_date || due_date,
          display_order: idx + 1
        }))

        const { error: stageErr } = await supabase
          .from('project_stages')
          .insert(stageRows)

        if (stageErr) throw stageErr
      }

      await fetchProjects()
      return { data: projectData, error: null }
    } catch (err) {
      console.error('Error creating project:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  // 2. Update Project Details
  const updateProject = async (id, updates) => {
    setError(null)
    if (!isSupabaseConfigured || !supabase) {
      const updated = projects.map(p => {
        if (p.id === id) {
          const newP = { ...p, ...updates }
          newP.progress = calculateProgressFromStages(newP.stages || [])
          return newP
        }
        return p
      })
      syncLocal(updated)
      return { error: null }
    }

    try {
      const { error: projErr } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          status: updates.status,
          start_date: updates.start_date,
          due_date: updates.due_date,
          progress: updates.progress
        })
        .eq('id', id)

      if (projErr) throw projErr
      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err.message)
      return { error: err }
    }
  }

  // 3. Delete Project
  const deleteProject = async (id) => {
    setError(null)
    if (!isSupabaseConfigured || !supabase) {
      const updated = projects.filter(p => p.id !== id)
      syncLocal(updated)
      return { error: null }
    }

    try {
      // CASCADE takes care of stages in postgres schema, but safe manual delete can also be handled
      const { error: delErr } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr
      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error deleting project:', err)
      setError(err.message)
      return { error: err }
    }
  }

  // 4. Add Stage
  const addStage = async (projectId, stageData) => {
    const project = projects.find(p => p.id === projectId)
    const currentStages = project?.stages || []
    const nextOrder = currentStages.length > 0 
      ? Math.max(...currentStages.map(s => s.display_order || 0)) + 1 
      : 1

    if (!isSupabaseConfigured || !supabase) {
      const newStage = {
        id: 'stage-' + Date.now(),
        project_id: projectId,
        name: stageData.name,
        description: stageData.description || '',
        status: stageData.status || 'Not Started',
        due_date: stageData.due_date || null,
        display_order: nextOrder
      }

      const updated = projects.map(p => {
        if (p.id === projectId) {
          const newStages = [...(p.stages || []), newStage]
          const progress = calculateProgressFromStages(newStages)
          return {
            ...p,
            stages: newStages,
            progress,
            status: progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : p.status)
          }
        }
        return p
      })
      syncLocal(updated)
      return { error: null }
    }

    try {
      const { data: newStage, error: stageErr } = await supabase
        .from('project_stages')
        .insert([
          {
            project_id: projectId,
            name: stageData.name,
            description: stageData.description || '',
            status: stageData.status || 'Not Started',
            due_date: stageData.due_date || null,
            display_order: nextOrder
          }
        ])
        .select()
        .single()

      if (stageErr) throw stageErr

      // Recompute project progress and sync
      const updatedStages = [...currentStages, newStage]
      const newProgress = calculateProgressFromStages(updatedStages)
      let newStatus = project.status
      if (newProgress === 100) newStatus = 'Completed'
      else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress'

      await supabase
        .from('projects')
        .update({ progress: newProgress, status: newStatus })
        .eq('id', projectId)

      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error adding stage:', err)
      return { error: err }
    }
  }

  // 5. Update Stage
  const updateStage = async (stageId, projectId, updates) => {
    if (!isSupabaseConfigured || !supabase) {
      const updated = projects.map(p => {
        if (p.id === projectId) {
          const newStages = (p.stages || []).map(s => s.id === stageId ? { ...s, ...updates } : s)
          const progress = calculateProgressFromStages(newStages)
          return {
            ...p,
            stages: newStages,
            progress,
            status: progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : p.status)
          }
        }
        return p
      })
      syncLocal(updated)
      return { error: null }
    }

    try {
      const { error: stageErr } = await supabase
        .from('project_stages')
        .update(updates)
        .eq('id', stageId)

      if (stageErr) throw stageErr

      // Recalculate progress
      const project = projects.find(p => p.id === projectId)
      const currentStages = (project?.stages || []).map(s => s.id === stageId ? { ...s, ...updates } : s)
      const newProgress = calculateProgressFromStages(currentStages)
      let newStatus = project?.status || 'In Progress'
      if (newProgress === 100) newStatus = 'Completed'
      else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress'

      await supabase
        .from('projects')
        .update({ progress: newProgress, status: newStatus })
        .eq('id', projectId)

      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error updating stage:', err)
      return { error: err }
    }
  }

  // 6. Delete Stage
  const deleteStage = async (stageId, projectId) => {
    if (!isSupabaseConfigured || !supabase) {
      const updated = projects.map(p => {
        if (p.id === projectId) {
          const newStages = (p.stages || []).filter(s => s.id !== stageId)
          const progress = calculateProgressFromStages(newStages)
          return {
            ...p,
            stages: newStages,
            progress
          }
        }
        return p
      })
      syncLocal(updated)
      return { error: null }
    }

    try {
      const { error: delErr } = await supabase
        .from('project_stages')
        .delete()
        .eq('id', stageId)

      if (delErr) throw delErr

      const project = projects.find(p => p.id === projectId)
      const currentStages = (project?.stages || []).filter(s => s.id !== stageId)
      const newProgress = calculateProgressFromStages(currentStages)

      await supabase
        .from('projects')
        .update({ progress: newProgress })
        .eq('id', projectId)

      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error deleting stage:', err)
      return { error: err }
    }
  }

  // 7. Reorder Stages
  const reorderStages = async (projectId, reorderedStages) => {
    const updatedStagesWithOrders = reorderedStages.map((s, idx) => ({
      ...s,
      display_order: idx + 1
    }))

    if (!isSupabaseConfigured || !supabase) {
      const updated = projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            stages: updatedStagesWithOrders
          }
        }
        return p
      })
      syncLocal(updated)
      return { error: null }
    }

    try {
      // Update each stage's display_order
      const promises = updatedStagesWithOrders.map(stage =>
        supabase
          .from('project_stages')
          .update({ display_order: stage.display_order })
          .eq('id', stage.id)
      )
      await Promise.all(promises)
      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error reordering stages:', err)
      return { error: err }
    }
  }

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        addStage,
        updateStage,
        deleteStage,
        reorderStages,
        calculateProgressFromStages
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
