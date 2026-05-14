import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMyProjects } from '../store/projectsSlice'
import EscrowStateMachine from '../components/EscrowStateMachine'
import {
  Typography, Box, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Button, Avatar,
  Rating, LinearProgress, Card, CardContent, Grid, Skeleton, CircularProgress
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  Add as AddIcon, TrendingUp as TrendingIcon, CheckCircle as CompletedIcon,
  AccessTime as InProgressIcon, Warning as DisputedIcon, Work as WorkIcon
} from '@mui/icons-material'
import { Link } from 'react-router-dom'

const STATUS_TABS = [
  { value: '', label: 'Все', color: 'default', icon: WorkIcon },
  { value: 'CREATED', label: 'Приём заявок', color: 'primary', icon: AddIcon },
  { value: 'PENDING_FUNDS', label: 'Ожидание оплаты', color: 'warning', icon: InProgressIcon },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'info', icon: InProgressIcon },
  { value: 'REVIEW', label: 'На проверке', color: 'secondary', icon: TrendingIcon },
  { value: 'COMPLETED', label: 'Завершённые', color: 'success', icon: CompletedIcon },
  { value: 'DISPUTED', label: 'Споры', color: 'error', icon: DisputedIcon }
]

const MyProjects = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { myProjects, loading } = useSelector((state) => state.projects)
  const [tab, setTab] = useState(0)

  const currentStatus = STATUS_TABS[tab].value
  const filteredProjects = currentStatus ? myProjects.filter((p) => p.status === currentStatus) : myProjects

  useEffect(() => {
    if (user) {
      dispatch(fetchMyProjects(currentStatus || undefined))
    }
  }, [dispatch, user, currentStatus])

  const stats = loading ? null : {
    total: myProjects.length,
    active: myProjects.filter(p => ['CREATED', 'PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW'].includes(p.status)).length,
    completed: myProjects.filter(p => p.status === 'COMPLETED').length,
    disputed: myProjects.filter(p => p.status === 'DISPUTED').length,
    totalEarned: myProjects
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.bids?.find(b => b.status === 'ACCEPTED')?.proposed_price || p.budget), 0)
  }

  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon sx={{ color: `${color}.main` }} />
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
          {value}
        </Typography>
        {subtext && (
          <Typography variant="caption" color="text.secondary">{subtext}</Typography>
        )}
      </CardContent>
    </Card>
  )

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {user?.role === 'customer' ? '📋 Мои заказы' : '💼 Мои проекты'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'customer' 
              ? 'Заказы, которые вы создали' 
              : 'Проекты, над которыми вы работаете'}
          </Typography>
        </Box>
        {user?.role === 'customer' && (
          <Button variant="contained" component={Link} to="/create-project" startIcon={<AddIcon />}>
            Новый заказ
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      {stats && (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard icon={WorkIcon} label="Всего проектов" value={stats.total} color="default" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={TrendingIcon} label="Активных" value={stats.active} color="info" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            icon={CompletedIcon} 
            label="Завершено" 
            value={stats.completed} 
            color="success"
            subtext={`на ${stats.totalEarned.toLocaleString('ru-RU')} ₽`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={DisputedIcon} label="Споров" value={stats.disputed} color={stats.disputed > 0 ? 'error' : 'default'} />
        </Grid>
      </Grid>)}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {STATUS_TABS.map((t, idx) => {
            const Icon = t.icon
            const count = idx === 0 ? (stats?.total ?? 0) : myProjects.filter((p) => p.status === t.value).length
            return (
              <Tab
                key={t.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon fontSize="small" />
                    {t.label}
                    {count > 0 && (
                      <Chip label={count} size="small" color={t.color} sx={{ height: 20, fontSize: 11 }} />
                    )}
                  </Box>
                }
              />
            )
          })}
        </Tabs>
      </Paper>

      {/* Projects Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Проект</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Бюджет</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дедлайн</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{user?.role === 'customer' ? 'Исполнитель' : 'Заказчик'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <WorkIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Проектов не найдено
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.role === 'customer' 
                        ? 'Создайте свой первый заказ прямо сейчас'
                        : 'Откликнитесь на интересные проекты в ленте'}
                    </Typography>
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
                      component={Link}
                      to={user?.role === 'customer' ? '/create-project' : '/'}
                    >
                      {user?.role === 'customer' ? 'Создать заказ' : 'Лента заказов'}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {p.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <EscrowStateMachine status={p.status} compact />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary">
                        {p.budget.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(p.deadline).toLocaleDateString('ru-RU')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.max(0, Math.min(100, 100 - ((new Date(p.deadline) - Date.now()) / (1000 * 60 * 60 * 24 * 7) * 100)))}
                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                      />
                    </TableCell>
                    <TableCell>
                      {user?.role === 'customer' && p.contractor ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 12 }}>
                            {p.contractor.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{p.contractor.username}</Typography>
                            <Rating value={p.contractor.rating || 0} readOnly size="small" />
                          </Box>
                        </Box>
                      ) : user?.role === 'contractor' && p.customer ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                            {p.customer.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{p.customer.username}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => navigate(`/project/${p.id}`)}>
                          Открыть
                        </Button>
                        {['PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DISPUTED'].includes(p.status) && (
                          <Button size="small" color="secondary" onClick={() => navigate(`/chat/${p.id}`)}>
                            Чат
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default MyProjects
