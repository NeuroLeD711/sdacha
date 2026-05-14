import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { initAuth, fetchMe } from './store/authSlice'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import MyProjects from './pages/MyProjects'
import CreateProject from './pages/CreateProject'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import { Box, CircularProgress } from '@mui/material'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  
  if (isAuthenticated) {
    return children
  }
  
  return <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return children
}

const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [initializing, setInitializing] = React.useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      dispatch(initAuth())
      dispatch(fetchMe())
        .finally(() => setInitializing(false))
    } else {
      setInitializing(false)
    }
  }, [dispatch])

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ProjectList />} />
        <Route path="project/:id" element={<ProjectDetail />} />
        <Route path="my-projects" element={<MyProjects />} />
        <Route path="create-project" element={<CreateProject />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
