import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../utils/api'
import { topupBalance, fetchMe } from '../store/authSlice'
import {
  Typography, Box, Paper, Avatar, Grid, Card, CardContent,
  Rating, Divider, Chip, CircularProgress, Alert, TextField,
  Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
  Star as StarIcon, Work as WorkIcon, AttachMoney as MoneyIcon,
  CheckCircle as CompleteIcon, Edit as EditIcon
} from '@mui/icons-material'

const ProfilePage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [topupOpen, setTopupOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')

  useEffect(() => {
    if (user) {
      api.get(`/reviews/user/${user.id}`)
        .then(res => setReviews(res.data.reviews))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleTopup = async () => {
    try {
      await dispatch(topupBalance(parseFloat(topupAmount))).unwrap()
      await dispatch(fetchMe()).unwrap()
    } catch (err) {
      setError(err || 'Ошибка пополнения')
    }
    setTopupOpen(false)
    setTopupAmount('')
  }

  if (!user) return null

  const positiveReviews = reviews.filter(r => r.rating >= 4).length
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        👤 Мой профиль
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Profile Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Avatar sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}>
            {user.username?.[0]?.toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.username}
              </Typography>
              <Chip 
                label={user.role === 'customer' ? 'Заказчик' : 'Исполнитель'} 
                color={user.role === 'customer' ? 'primary' : 'secondary'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={parseFloat(avgRating)} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                {avgRating} ({user.total_reviews} отзывов)
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2, minWidth: 150 }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {user.balance?.toLocaleString('ru-RU')} ₽
            </Typography>
            <Typography variant="body2" color="text.secondary">Баланс</Typography>
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mt: 1 }}
              onClick={() => setTopupOpen(true)}
            >
              Пополнить
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4">{avgRating}</Typography>
              <Typography variant="caption" color="text.secondary">Рейтинг</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WorkIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4">{user.total_reviews}</Typography>
              <Typography variant="caption" color="text.secondary">Проектов</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CompleteIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4">{positiveReviews}</Typography>
              <Typography variant="caption" color="text.secondary">Положительных</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4">{reviews.length > 0 ? Math.round(avgRating * 20) : 0}%</Typography>
              <Typography variant="caption" color="text.secondary">Успешность</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reviews */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>📝 Отзывы</Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Пока нет отзывов. Завершите проекты, чтобы получить отзывы!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <Card key={review.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={review.rating >= 4 ? '✓ Положительный' : review.rating >= 3 ? '~ Нейтральный' : '✗ Отрицательный'}
                      size="small"
                      color={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'error'}
                    />
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Topup Dialog */}
      <Dialog open={topupOpen} onClose={() => setTopupOpen(false)}>
        <DialogTitle>💰 Пополнение баланса</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Текущий баланс: <strong>{user.balance?.toLocaleString('ru-RU')} ₽</strong>
          </Typography>
          <TextField
            fullWidth
            label="Сумма"
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopupOpen(false)}>Отмена</Button>
          <Button onClick={handleTopup} variant="contained" disabled={!topupAmount || topupAmount <= 0}>
            Пополнить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProfilePage
