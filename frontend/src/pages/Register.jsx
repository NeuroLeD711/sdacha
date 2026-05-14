import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register, clearError } from '../store/authSlice'
import {
  Container, Box, TextField, Button, Typography, Alert, Paper, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'customer' })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(clearError())
    dispatch(register(form)).unwrap().then(() => navigate('/')).catch(() => {})
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', backdropFilter: 'blur(6px)' }}>
        <Typography variant="h4" gutterBottom align="center">Регистрация</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Создайте аккаунт заказчика или исполнителя
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Имя пользователя" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth />
          <TextField label="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
          <TextField label="Пароль" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth />
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select value={form.role} label="Роль"
              onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="customer">Заказчик</MenuItem>
              <MenuItem value="contractor">Исполнитель</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
          <Typography align="center">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default Register
