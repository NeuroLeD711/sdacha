import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  AppBar, Toolbar, Typography, Button, Container, Box, Badge, Avatar, Menu, MenuItem,
  IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider
} from '@mui/material'
import { logout } from '../store/authSlice'
import {
  Work as WorkIcon, FormatListBulleted as ListIcon, Add as AddIcon,
  Person as PersonIcon, ExitToApp as LogoutIcon, Menu as MenuIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material'

const Layout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const navItems = [
    { label: 'Лента заказов', path: '/', icon: WorkIcon },
    { label: 'Мои заказы', path: '/my-projects', icon: ListIcon },
    ...(user?.role === 'customer' ? [{ label: 'Создать заказ', path: '/create-project', icon: AddIcon }] : []),
  ]

  const isActive = (path) => location.pathname === path

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{
                  '&.Mui-selected': { bgcolor: 'primary.50' },
                  '&.Mui-selected:hover': { bgcolor: 'primary.100' }
                }}
              >
                <ListItemIcon><Icon color={isActive(item.path) ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        })}
        <Divider sx={{ my: 1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate('/profile'); setMobileOpen(false) }}>
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="Профиль" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(110deg, #0b5fff 0%, #1a78ff 55%, #ff8a00 160%)',
          borderBottom: '1px solid rgba(255,255,255,0.18)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🛡️ Фриланс-Эскроу
          </Typography>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={<Icon />}
                  onClick={() => navigate(item.path)}
                  sx={{
                    bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                    fontWeight: isActive(item.path) ? 700 : 400
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />

          {/* Balance */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            gap: 1,
            bgcolor: 'rgba(255,255,255,0.1)',
            px: 2,
            py: 0.5,
            borderRadius: 2
          }}>
            <BalanceIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.balance?.toLocaleString('ru-RU')} ₽
            </Typography>
          </Box>

          {/* User Menu */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 2 }}>
            <Badge badgeContent={user?.rating?.toFixed(1)} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 14 }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Badge>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <PersonIcon sx={{ mr: 1 }} /> 
              {user?.username}
            </MenuItem>
            <MenuItem disabled>
              <BalanceIcon sx={{ mr: 1 }} /> 
              Баланс: {user?.balance?.toLocaleString('ru-RU')} ₽
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile') }}>
              👤 Профиль
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1 }} /> Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280 } }}
      >
        {drawer}
      </Drawer>

      {/* Content */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.8)', borderTop: '1px solid', borderColor: 'divider', py: 2, mt: 4 }}>
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            Фриланс-Эскроу • Безопасные сделки для фриланса • 2026
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default Layout
