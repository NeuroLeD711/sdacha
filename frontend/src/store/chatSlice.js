import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

const initialState = {
  messages: [],
  loading: false,
  error: null
}

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/chat/${projectId}`)
    return data
  } catch (error) {
    return rejectWithValue(error.response?.data?.error || 'Не удалось загрузить сообщения')
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    clearChat: (state) => {
      state.messages = []
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.loading = true })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        state.messages = action.payload.messages
        state.error = null
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload
          : 'Не удалось загрузить сообщения'
      })
  }
})

export const { addMessage, setMessages, clearChat } = chatSlice.actions
export default chatSlice.reducer
