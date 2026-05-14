import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMessages, addMessage, clearChat } from '../store/chatSlice'
import { io } from 'socket.io-client'
import api from '../utils/api'
import {
  Box, TextField, Button, Typography, Paper, Avatar, Divider,
  CircularProgress, Chip, IconButton, Tooltip
} from '@mui/material'
import {
  Send as SendIcon, ArrowBack as BackIcon, Circle as OnlineIcon,
} from '@mui/icons-material'

const ChatPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { messages, loading, error: chatError } = useSelector((state) => state.chat)
  const { user, access_token } = useSelector((state) => state.auth)
  const [text, setText] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [socketError, setSocketError] = useState(null)
  const [canConnectSocket, setCanConnectSocket] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let active = true
    dispatch(clearChat())
    dispatch(fetchMessages(id))
      .unwrap()
      .then(() => {
        if (!active) return
        setCanConnectSocket(true)
        setSocketError(null)
      })
      .catch((err) => {
        if (!active) return
        setCanConnectSocket(false)
        setSocketError(typeof err === 'string' ? err : 'Нет доступа к чату')
      })
    return () => {
      active = false
    }
  }, [dispatch, id])

  useEffect(() => {
    if (!access_token || !canConnectSocket) {
      return
    }

    const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin
    const socket = io(wsUrl, {
      query: { token: access_token },
      auth: { token: access_token },
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      setSocketError(null)
      socket.emit('join_project', { project_id: parseInt(id) })
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      setSocketError(error?.message || 'Ошибка подключения к чату')
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socket.on('connected', (data) => {
      console.log('Socket authenticated:', data)
    })

    socket.on('joined', (data) => {
      console.log('Joined room:', data)
      setSocketError(null)
    })

    socket.on('new_message', (msg) => {
      console.log('New message received:', msg)
      dispatch(addMessage(msg))
    })

    socket.on('error', (data) => {
      console.error('Socket error:', data)
      setSocketError(data?.message || 'Ошибка')
      setIsConnected(false)
      if (data?.message?.includes('Access denied') || data?.message?.includes('Not authenticated')) {
        socket.disconnect()
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [dispatch, id, access_token, canConnectSocket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const messageText = text.trim()
    if (!messageText) return

    const socket = socketRef.current
    if (socket && isConnected) {
      socket.emit('send_message', {
        project_id: parseInt(id),
        content: messageText
      })
      setText('')
      inputRef.current?.focus()
      return
    }

    // REST fallback if websocket is unavailable.
    try {
      const { data } = await api.post(`/chat/${id}`, { content: messageText })
      if (data?.message) {
        dispatch(addMessage(data.message))
      } else {
        dispatch(fetchMessages(id))
      }
      setText('')
      setSocketError('WebSocket недоступен, сообщение отправлено через API')
      inputRef.current?.focus()
    } catch (error) {
      setSocketError(error?.response?.data?.error || 'Не удалось отправить сообщение')
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' +
           date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long'
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <Paper sx={{ height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'grey.50'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton component={Link} to={`/project/${id}`} size="small">
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6">💬 Чат проекта #{id}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OnlineIcon sx={{ fontSize: 12, color: isConnected ? 'success.main' : 'error.main' }} />
          <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
            {isConnected ? 'Подключено' : 'Отключено'}
          </Typography>
          {socketError && (
            <Typography variant="caption" color="error.main" sx={{ ml: 1 }}>
              {socketError}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Начните общение
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Обсудите детали проекта в этом чате. Все сообщения сохраняются.
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <Box key={date}>
              {/* Date Divider */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Chip 
                  label={date} 
                  size="small" 
                  sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                />
              </Box>

              {/* Messages */}
              {msgs.map((msg) => {
                const isMine = Number(msg.sender_id) === Number(user?.id)
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      mb: 1.5
                    }}
                  >
                    <Box sx={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: 1
                    }}>
                      {!isMine && (
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
                          {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                      )}
                      <Box sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: isMine 
                          ? '16px 16px 4px 16px' 
                          : '16px 16px 16px 4px',
                        bgcolor: isMine ? 'primary.main' : 'background.paper',
                        color: isMine ? 'white' : 'text.primary',
                        boxShadow: 1,
                        position: 'relative'
                      }}>
                        {!isMine && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              mb: 0.5, 
                              fontWeight: 600,
                              color: 'primary.main'
                            }}
                          >
                            {msg.sender?.username}
                          </Typography>
                        )}
                        <Typography variant="body1" sx={{ 
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {msg.content}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            textAlign: 'right',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: 10
                          }}
                        >
                          {formatTime(msg.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          ))
        )}
        {!loading && !messages.length && chatError && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="error.main">
              {chatError}
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Divider />
      <Box 
        component="form" 
        onSubmit={handleSend} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          gap: 1,
          bgcolor: 'background.paper'
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={isConnected ? "Введите сообщение..." : "Введите сообщение (отправка через API)"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!access_token}
          inputRef={inputRef}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
        />
        <Tooltip title="Отправить">
          <Button
            type="submit"
            variant="contained"
            disabled={!text.trim() || !access_token}
            sx={{ 
              borderRadius: 3,
              minWidth: 56,
              px: 2
            }}
          >
            <SendIcon />
          </Button>
        </Tooltip>
      </Box>
    </Paper>
  )
}

export default ChatPage
