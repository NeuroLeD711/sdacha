import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login, clearError } from '../store/authSlice'
import {
  Container, Box, TextField, Button, Typography, Alert, Paper
} from '@mui/material'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', password: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(clearError())
    dispatch(login(form)).unwrap().then(() => navigate('/')).catch(() => {})
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', backdropFilter: 'blur(6px)' }}>
        <Typography variant="h4" gutterBottom align="center">Вход</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Продолжите работу в защищенной системе эскроу
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Имя пользователя" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth />
          <TextField label="Пароль" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
          <Typography align="center">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default Login
