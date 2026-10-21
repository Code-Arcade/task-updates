import React from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { AppContent } from './AppContent'
import './App.css'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectsProvider>
          <AppContent />
        </ProjectsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
