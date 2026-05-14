import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

const initialState = {
  user: null,
  access_token: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Failed to fetch user')
  }
})

export const topupBalance = createAsyncThunk('auth/topup', async (amount, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/topup', { amount })
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Top-up failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.access_token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    clearError: (state) => {
      state.error = null
    },
    initAuth: (state) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        state.access_token = token
        state.isAuthenticated = true
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.access_token = action.payload.access_token
        state.isAuthenticated = true
        localStorage.setItem('access_token', action.payload.access_token)
        localStorage.setItem('refresh_token', action.payload.refresh_token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.access_token = action.payload.access_token
        state.isAuthenticated = true
        localStorage.setItem('access_token', action.payload.access_token)
        localStorage.setItem('refresh_token', action.payload.refresh_token)
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.access_token = null
        state.isAuthenticated = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .addCase(topupBalance.fulfilled, (state, action) => {
        state.user = action.payload.user
      })
  }
})

export const { logout, clearError, initAuth } = authSlice.actions
export default authSlice.reducer
