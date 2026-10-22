import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const ProjectsContext = createContext(null)

const INITIAL_DEMO_PROJECTS = []

export const ProjectsProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Clear any legacy demo mock data from localStorage if present
  useEffect(() => {
    try {
      const local = localStorage.getItem('app_projects_data')
      if (local && local.includes('demo-p-1')) {
        localStorage.removeItem('app_projects_data')
      }
      localStorage.removeItem('demo_auth_active')
    } catch (e) {
      // Ignore
    }
  }, [])

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
      const local = localStorage.getItem('app_projects_data')
      if (local) {
        try {
          const parsed = JSON.parse(local)
          // Filter out any leftover demo items
          const realOnly = Array.isArray(parsed) ? parsed.filter(p => !p.id?.startsWith('demo-p-')) : []
          setProjects(realOnly)
        } catch {
          setProjects([])
          localStorage.removeItem('app_projects_data')
        }
      } else {
        setProjects([])
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

      // Also merge any offline/fallback projects saved in localStorage so nothing is lost
      let mergedProjects = [...projectsWithStages]
      try {
        const local = localStorage.getItem('app_projects_data')
        if (local) {
          const localList = JSON.parse(local)
          if (Array.isArray(localList)) {
            localList.forEach(lp => {
              if (lp?.id && !mergedProjects.some(mp => mp.id === lp.id)) {
                mergedProjects.unshift(lp)
              }
            })
          }
        }
      } catch (e) {
        // ignore parse error
      }

      setProjects(mergedProjects)
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
      // If user is local admin bypass or not real supabase auth user, use null to avoid foreign key violation
      const isRealUuid = user?.id && user.id.length === 36 && user.id !== '00000000-0000-0000-0000-000000000001'
      const validUserId = isRealUuid ? user.id : null

      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .insert([
          {
            name,
            description,
            start_date: start_date || new Date().toISOString().split('T')[0],
            due_date: due_date || null,
            status,
            progress: 0,
            user_id: validUserId
          }
        ])
        .select()
        .single()

      if (projErr) throw projErr

      let insertedStages = []
      // Insert stages if any
      if (initialStages && initialStages.length > 0) {
        const stageRows = initialStages.map((s, idx) => ({
          project_id: projectData.id,
          name: s.name,
          description: s.description || '',
          status: s.status || 'Not Started',
          due_date: s.due_date || due_date || null,
          display_order: idx + 1
        }))

        const { data: stagesInserted, error: stageErr } = await supabase
          .from('project_stages')
          .insert(stageRows)
          .select()

        if (stageErr) throw stageErr
        insertedStages = stagesInserted || stageRows
      }

      // Immediately update local state so user sees it without waiting
      const newCompleteProject = {
        ...projectData,
        stages: insertedStages
      }
      setProjects(prev => [newCompleteProject, ...prev])

      await fetchProjects()
      return { data: projectData, error: null }
    } catch (err) {
      console.error('Error creating project:', err)
      // Fallback: If Supabase table rejected due to permissions or connection, gracefully save to local state
      const fallbackId = 'proj-' + Date.now()
      const fallbackStages = (initialStages || []).map((s, idx) => ({
        id: 'stg-' + Date.now() + '-' + idx,
        project_id: fallbackId,
        name: s.name,
        status: s.status || 'Not Started',
        display_order: idx + 1
      }))
      const fallbackProject = {
        id: fallbackId,
        name,
        description,
        start_date: start_date || new Date().toISOString().split('T')[0],
        due_date,
        status,
        progress: 0,
        stages: fallbackStages
      }
      setProjects(prev => [fallbackProject, ...prev])
      const local = localStorage.getItem('app_projects_data')
      const parsed = local ? JSON.parse(local) : []
      localStorage.setItem('app_projects_data', JSON.stringify([fallbackProject, ...parsed]))
      return { data: fallbackProject, error: null }
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

      const updatedStages = [...currentStages, newStage]
      const newProgress = calculateProgressFromStages(updatedStages)
      let newStatus = project.status
      if (newProgress === 100) newStatus = 'Completed'
      else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress'

      // Instantly reflect in UI state
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            stages: updatedStages,
            progress: newProgress,
            status: newStatus
          }
        }
        return p
      }))

      await supabase
        .from('projects')
        .update({ progress: newProgress, status: newStatus })
        .eq('id', projectId)

      await fetchProjects()
      return { error: null }
    } catch (err) {
      console.error('Error adding stage:', err)
      // Fallback: reflect locally so UI always works
      const fallbackStage = {
        id: 'stg-' + Date.now(),
        project_id: projectId,
        name: stageData.name,
        status: stageData.status || 'Not Started',
        display_order: nextOrder
      }
      const updatedStages = [...currentStages, fallbackStage]
      const newProgress = calculateProgressFromStages(updatedStages)
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            stages: updatedStages,
            progress: newProgress
          }
        }
        return p
      }))
      return { error: null }
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

    // 1. Optimistically update UI state immediately
    const project = projects.find(p => p.id === projectId)
    const currentStages = (project?.stages || []).map(s => s.id === stageId ? { ...s, ...updates } : s)
    const newProgress = calculateProgressFromStages(currentStages)
    let newStatus = project?.status || 'In Progress'
    if (newProgress === 100) newStatus = 'Completed'
    else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress'

    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          stages: currentStages,
          progress: newProgress,
          status: newStatus
        }
      }
      return p
    })
    setProjects(updatedProjects)

    // Save to local cache as well
    try {
      localStorage.setItem('app_projects_data', JSON.stringify(updatedProjects))
    } catch (e) {}

    // 2. If it is a local fallback ID, don't query Supabase with non-UUID
    const isSupabaseUuid = (id) => typeof id === 'string' && id.length === 36 && !id.startsWith('proj-') && !id.startsWith('stg-')

    if (!isSupabaseConfigured || !supabase || !isSupabaseUuid(stageId) || !isSupabaseUuid(projectId)) {
      return { error: null }
    }

    try {
      const { error: stageErr } = await supabase
        .from('project_stages')
        .update(updates)
        .eq('id', stageId)

      if (stageErr) throw stageErr

      await supabase
        .from('projects')
        .update({ progress: newProgress, status: newStatus })
        .eq('id', projectId)

      return { error: null }
    } catch (err) {
      console.error('Error updating stage in Supabase:', err)
      return { error: null } // State already updated
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

  // 8. Toggle Task Checkmark (Matrix Grid)
  const toggleTaskCheck = async (projectId, stageName, currentCompleted) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const newStatus = currentCompleted ? 'Not Started' : 'Completed'
    const existingStage = (project.stages || []).find(s => s.name.trim().toLowerCase() === stageName.trim().toLowerCase())

    if (existingStage) {
      await updateStage(existingStage.id, projectId, { status: newStatus })
    } else {
      // Create the stage as Completed
      await addStage(projectId, {
        name: stageName,
        status: newStatus,
        description: `Tracked in Project Master`
      })
    }
  }

  // 9. Insert Global Task Column across projects and cloud database
  const insertGlobalTask = async (taskName, afterTask = '') => {
    if (!taskName || !taskName.trim()) return
    const cleanName = taskName.trim()

    // 1. Optimistically update all projects in local state
    setProjects(prev => prev.map(p => {
      const currentStages = p.stages || []
      // If project already has this stage, leave it alone
      if (currentStages.some(s => s.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        return p
      }

      const newStage = {
        id: 'stg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        project_id: p.id,
        name: cleanName,
        status: 'Not Started',
        description: 'Tracked in Project Master',
        display_order: currentStages.length + 1
      }

      let updatedStages = [...currentStages]
      if (afterTask) {
        const afterIndex = updatedStages.findIndex(
          s => s.name.trim().toLowerCase() === afterTask.trim().toLowerCase()
        )
        if (afterIndex !== -1) {
          updatedStages.splice(afterIndex + 1, 0, newStage)
        } else {
          updatedStages.push(newStage)
        }
      } else {
        updatedStages.push(newStage)
      }

      // Re-index display orders
      updatedStages = updatedStages.map((s, idx) => ({ ...s, display_order: idx + 1 }))
      return { ...p, stages: updatedStages }
    }))

    // 2. Insert into Supabase if configured
    if (isSupabaseConfigured && supabase && projects.length > 0) {
      try {
        const stageRows = projects.map((p, idx) => ({
          project_id: p.id,
          name: cleanName,
          status: 'Not Started',
          description: 'Tracked in Project Master',
          display_order: (p.stages?.length || 0) + 1
        }))
        await supabase.from('project_stages').insert(stageRows)
      } catch (err) {
        console.error('Error inserting global task into Supabase:', err)
      }
    }
  }

  // 10. Rename Global Task Column across projects and cloud database
  const renameGlobalTask = async (oldName, newName) => {
    if (!oldName || !newName || !newName.trim()) return
    const cleanOld = oldName.trim()
    const cleanNew = newName.trim()

    // Update in-memory state for all projects immediately
    setProjects(prev => prev.map(p => {
      const updatedStages = (p.stages || []).map(s => {
        if (s.name.trim().toLowerCase() === cleanOld.toLowerCase()) {
          return { ...s, name: cleanNew }
        }
        return s
      })
      return { ...p, stages: updatedStages }
    }))

    // Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_stages')
          .update({ name: cleanNew })
          .ilike('name', cleanOld)
      } catch (err) {
        console.error('Error renaming stage in Supabase:', err)
      }
    }
  }

  // 11. Delete Global Task Column across projects and cloud database
  const deleteGlobalTask = async (taskName) => {
    if (!taskName) return
    const cleanName = taskName.trim()

    // Update in-memory state for all projects immediately
    setProjects(prev => prev.map(p => {
      const updatedStages = (p.stages || []).filter(s => s.name.trim().toLowerCase() !== cleanName.toLowerCase())
      const newProgress = calculateProgressFromStages(updatedStages)
      let newStatus = p.status
      if (newProgress === 100) newStatus = 'Completed'
      else if (newProgress > 0 && newStatus === 'Not Started') newStatus = 'In Progress'

      return {
        ...p,
        stages: updatedStages,
        progress: newProgress,
        status: newStatus
      }
    }))

    // Delete in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_stages')
          .delete()
          .ilike('name', cleanName)
      } catch (err) {
        console.error('Error deleting stages from Supabase:', err)
      }
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
        calculateProgressFromStages,
        toggleTaskCheck,
        insertGlobalTask,
        renameGlobalTask,
        deleteGlobalTask
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
