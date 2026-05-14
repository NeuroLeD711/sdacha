import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProjects } from '../store/projectsSlice'
import EscrowStateMachine from '../components/EscrowStateMachine'
import {
  Typography, Grid, Card, CardContent, CardActions, Button, Chip, Box,
  TextField, MenuItem, Pagination, CircularProgress, InputAdornment,
  Select, FormControl, InputLabel, Skeleton, Alert, IconButton, Tooltip, Paper, Collapse
} from '@mui/material'
import {
  Search as SearchIcon, FilterList as FilterIcon, Sort as SortIcon,
  AccessTime as TimeIcon, AttachMoney as MoneyIcon, Work as WorkIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material'

const CATEGORIES = [
  'Все категории', 'Web Development', 'Mobile Development', 'Design',
  'Copywriting', 'Marketing', 'Bot Development', 'Data Science', 'DevOps',
  'Video Production', 'Audio Production', 'Other'
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Новые первыми' },
  { value: 'oldest', label: 'Старые первыми' },
  { value: 'budget_high', label: 'По убыванию бюджета' },
  { value: 'budget_low', label: 'По возрастанию бюджета' },
  { value: 'deadline', label: 'По сроку (срочные)' }
]

const ProjectCard = ({ project }) => {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const daysLeft = Math.ceil((new Date(project.deadline) - Date.now()) / (1000 * 60 * 60 * 24))
  const isUrgent = daysLeft <= 2 && daysLeft > 0
  const isOverdue = daysLeft < 0

  const isContractor = user?.role === 'contractor'
  const isAvailable = project.status === 'CREATED' && isContractor

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      border: isAvailable ? '2px solid' : 'none',
      borderColor: 'success.main',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4
      }
    }}>
      {isAvailable && (
        <Box sx={{ 
          bgcolor: 'success.main', 
          color: 'white', 
          py: 0.5, 
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 12
        }}>
          🎯 ДОСТУПЕН ДЛЯ ИСПОЛНИТЕЛЯ
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Chip 
            label={project.category} 
            color="primary" 
            size="small"
            sx={{ fontSize: 11 }}
          />
          <EscrowStateMachine status={project.status} compact />
        </Box>

        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 60
          }}
        >
          {project.title}
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            minHeight: 60,
            mb: 2
          }}
        >
          {project.description}
        </Typography>

        {project.skills && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {project.skills.split(',').slice(0, 3).map((skill, i) => (
              <Chip key={i} label={skill.trim()} size="small" variant="outlined" sx={{ fontSize: 10 }} />
            ))}
            {project.skills.split(',').length > 3 && (
              <Chip label={`+${project.skills.split(',').length - 3}`} size="small" sx={{ fontSize: 10 }} />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
            {project.budget.toLocaleString('ru-RU')} ₽
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: 16, color: isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'text.secondary' }} />
            <Typography 
              variant="caption" 
              color={isOverdue ? 'error' : isUrgent ? 'warning.main' : 'text.secondary'}
            >
              {isOverdue ? 'Просрочен' : isUrgent ? `${daysLeft} дн.` : `${daysLeft} дн.`}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        {isAvailable ? (
          <Button 
            size="medium" 
            variant="contained" 
            color="success"
            component={Link} 
            to={`/project/${project.id}`}
            fullWidth
            sx={{ py: 1, fontWeight: 700 }}
          >
            🎯 ВЗЯТЬ ЗАКАЗ
          </Button>
        ) : (
          <Button 
            size="small" 
            variant="outlined" 
            component={Link} 
            to={`/project/${project.id}`}
            fullWidth
          >
            {isContractor && project.status === 'IN_PROGRESS' ? 'Продолжить →' : 
             isContractor && project.status === 'REVIEW' ? 'На проверке →' : 'Подробнее →'}
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

const ProjectList = () => {
  const dispatch = useDispatch()
  const { projects, loading, pagination } = useSelector((state) => state.projects)
  const [filters, setFilters] = useState({
    category: '',
    min_budget: '',
    max_budget: '',
    sort: 'newest',
    search: '',
    page: 1
  })
  const [showFilters, setShowFilters] = useState(false)

  const loadProjects = useCallback(() => {
    const params = { page: filters.page }
    if (filters.category) params.category = filters.category
    if (filters.min_budget) params.min_budget = filters.min_budget
    if (filters.max_budget) params.max_budget = filters.max_budget
    if (filters.sort) params.sort = filters.sort
    if (filters.search) params.search = filters.search
    dispatch(fetchProjects(params))
  }, [dispatch, filters])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const handlePageChange = (e, page) => {
    setFilters({ ...filters, page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFiltersCount = [
    filters.category,
    filters.min_budget,
    filters.max_budget,
    filters.search
  ].filter(Boolean).length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            🔍 Лента заказов
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination.total} проектов найдено
          </Typography>
        </Box>
        <Button 
          variant={showFilters ? 'contained' : 'outlined'}
          onClick={() => setShowFilters(!showFilters)}
          startIcon={<FilterIcon />}
        >
          Фильтры {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </Box>

      {/* Search & Sort Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Поиск по названию или описанию..."
            value={filters.search}
            onChange={handleSearch}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Сортировка</InputLabel>
            <Select
              value={filters.sort}
              label="Сортировка"
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Expandable Filters */}
        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Категория</InputLabel>
              <Select
                value={filters.category}
                label="Категория"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat === 'Все категории' ? '' : cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Мин. бюджет"
              type="number"
              value={filters.min_budget}
              onChange={(e) => handleFilterChange('min_budget', e.target.value)}
              sx={{ width: 140 }}
              InputProps={{ endAdornment: <InputAdornment position="end">₽</InputAdornment> }}
            />
            <TextField
              size="small"
              label="Макс. бюджет"
              type="number"
              value={filters.max_budget}
              onChange={(e) => handleFilterChange('max_budget', e.target.value)}
              sx={{ width: 140 }}
              InputProps={{ endAdornment: <InputAdornment position="end">₽</InputAdornment> }}
            />
            {activeFiltersCount > 0 && (
              <Button 
                variant="text" 
                color="error"
                onClick={() => setFilters({ ...filters, category: '', min_budget: '', max_budget: '', search: '', page: 1 })}
              >
                Сбросить фильтры
              </Button>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Projects Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 2 }}>
                <Skeleton variant="text" width="30%" height={24} />
                <Skeleton variant="text" width="80%" height={32} sx={{ my: 1 }} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="rectangular" height={40} sx={{ mt: 2, borderRadius: 1 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <WorkIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Проекты не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Попробуйте изменить параметры поиска или создайте свой проект
          </Typography>
          <Button variant="contained" component={Link} to="/create-project">
            Создать заказ
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.pages}
            page={filters.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Quick Stats */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{pagination.total}</Typography>
              <Typography variant="caption" color="text.secondary">Всего проектов</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {projects.filter(p => p.status === 'CREATED').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Открытых</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {projects.filter(p => p.status === 'IN_PROGRESS').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">В работе</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {projects.filter(p => p.status === 'REVIEW').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">На проверке</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default ProjectList
