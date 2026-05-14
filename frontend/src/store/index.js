import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import projectsReducer from './projectsSlice'
import chatReducer from './chatSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    chat: chatReducer
  }
})

export default store
