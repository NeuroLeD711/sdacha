import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

const initialState = {
  projects: [],
  currentProject: null,
  myProjects: [],
  loading: false,
  error: null,
  pagination: { page: 1, total: 0, pages: 0 }
}

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  const { data } = await api.get(`/projects${qs ? '?' + qs : ''}`)
  return data
})

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id) => {
  const { data } = await api.get(`/projects/${id}`)
  return data
})

export const fetchMyProjects = createAsyncThunk('projects/fetchMy', async (status) => {
  const { data } = await api.get(`/projects/my${status ? '?status=' + status : ''}`)
  return data
})

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', projectData)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to create project')
  }
})

export const takeProject = createAsyncThunk('projects/take', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/take`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to take project')
  }
})

export const placeBid = createAsyncThunk('projects/placeBid', async ({ projectId, coverLetter, proposedPrice, proposedDays }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/bid`, {
      cover_letter: coverLetter,
      proposed_price: proposedPrice,
      proposed_days: proposedDays
    })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to place bid')
  }
})

export const acceptBid = createAsyncThunk('projects/acceptBid', async ({ projectId, bidId }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/accept-bid/${bidId}`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to accept bid')
  }
})

export const submitWork = createAsyncThunk('projects/submitWork', async ({ projectId, workResult }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/submit-work`, { work_result: workResult })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to submit work')
  }
})

export const completeProject = createAsyncThunk('projects/complete', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/complete`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to complete project')
  }
})

export const disputeProject = createAsyncThunk('projects/dispute', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/dispute`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to dispute project')
  }
})

export const resolveDispute = createAsyncThunk('projects/resolveDispute', async ({ projectId, action }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/resolve-dispute`, { action })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to resolve dispute')
  }
})

export const cancelProject = createAsyncThunk('projects/cancel', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/projects/${projectId}/cancel`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to cancel project')
  }
})

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload.projects
        state.pagination = {
          page: action.payload.current_page,
          total: action.payload.total,
          pages: action.payload.pages
        }
      })
      .addCase(fetchProjects.rejected, (state) => { state.loading = false })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(fetchMyProjects.pending, (state) => { state.loading = true })
      .addCase(fetchMyProjects.fulfilled, (state, action) => {
        state.loading = false
        state.myProjects = action.payload.projects
      })
      .addCase(fetchMyProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'Failed to load projects'
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload.project)
      })
      .addCase(takeProject.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
        if (!state.myProjects.find(p => p.id === action.payload.project.id)) {
          state.myProjects.unshift(action.payload.project)
        }
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        if (state.currentProject && action.payload?.bid) {
          state.currentProject.bids = [...(state.currentProject.bids || []), action.payload.bid]
        }
      })
      .addCase(acceptBid.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(submitWork.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(completeProject.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(disputeProject.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(resolveDispute.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
      .addCase(cancelProject.fulfilled, (state, action) => {
        state.currentProject = action.payload.project
      })
  }
})

export const { clearCurrentProject, clearError } = projectsSlice.actions
export default projectsSlice.reducer
