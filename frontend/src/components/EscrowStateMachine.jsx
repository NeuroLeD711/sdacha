import React from 'react'
import { Box, Typography, Chip, Tooltip, LinearProgress } from '@mui/material'
import {
  Create as CreateIcon, Payment as PaymentIcon, Code as CodeIcon,
  RateReview as ReviewIcon, CheckCircle as CompleteIcon, Warning as DisputeIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'

const STATUS_CONFIG = {
  CREATED: {
    label: 'Создан',
    description: 'Заказ опубликован, идёт приём откликов',
    icon: CreateIcon,
    color: 'primary',
    bgColor: '#e3f2fd'
  },
  PENDING_FUNDS: {
    label: 'Ожидание оплаты',
    description: 'Исполнитель выбран, ожидается депонирование средств',
    icon: PaymentIcon,
    color: 'warning',
    bgColor: '#fff3e0'
  },
  IN_PROGRESS: {
    label: 'В работе',
    description: 'Средства заблокированы, исполнитель выполняет работу',
    icon: CodeIcon,
    color: 'info',
    bgColor: '#e8f5e9'
  },
  REVIEW: {
    label: 'На проверке',
    description: 'Работа сдана, заказчик проверяет результат',
    icon: ReviewIcon,
    color: 'secondary',
    bgColor: '#f3e5f5'
  },
  COMPLETED: {
    label: 'Завершён',
    description: 'Сделка успешно завершена, средства переведены исполнителю',
    icon: CompleteIcon,
    color: 'success',
    bgColor: '#e8f5e9'
  },
  DISPUTED: {
    label: 'Спор',
    description: 'Возник спор — средства заморожены до решения',
    icon: DisputeIcon,
    color: 'error',
    bgColor: '#ffebee'
  },
  CANCELLED: {
    label: 'Отменён',
    description: 'Заказ отменён заказчиком',
    icon: CancelIcon,
    color: 'default',
    bgColor: '#f5f5f5'
  }
}

const FLOW_STATES = ['CREATED', 'PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']

const EscrowStateMachine = ({ status, compact = false }) => {
  const currentIndex = FLOW_STATES.indexOf(status)
  const isDisputed = status === 'DISPUTED'
  const isCancelled = status === 'CANCELLED'
  const isCompleted = status === 'COMPLETED'

  if (compact) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED
    const Icon = config.icon
    return (
      <Tooltip title={config.description}>
        <Chip
          icon={<Icon />}
          label={config.label}
          color={config.color}
          size="small"
        />
      </Tooltip>
    )
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        🔐 Статус безопасной сделки (Escrow)
      </Typography>

      {/* Progress Bar */}
      {!isDisputed && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(((currentIndex + 1) / FLOW_STATES.length) * 100, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: isCompleted ? 'success.main' : 'primary.main'
              }
            }}
          />
        </Box>
      )}

      {/* Flow States */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {/* Connecting Line */}
        {!isDisputed && (
          <Box sx={{
            position: 'absolute',
            top: 20,
            left: 40,
            right: 40,
            height: 2,
            bgcolor: 'grey.300',
            zIndex: 0
          }} />
        )}

        {FLOW_STATES.map((state, idx) => {
          const config = STATUS_CONFIG[state]
          const Icon = config.icon
          const isActive = idx === currentIndex
          const isPast = idx < currentIndex || isCompleted
          const isCurrent = state === status

          return (
            <Box
              key={state}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
                flex: 1
              }}
            >
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: isPast ? config.color + '.main' : isActive ? config.color + '.main' : 'grey.300',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? `0 0 0 4px ${config.color}30` : 'none',
                transition: 'all 0.3s',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}>
                {isPast && !isCurrent ? <CompleteIcon fontSize="small" /> : <Icon fontSize="small" />}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? config.color + '.main' : 'text.secondary',
                  textAlign: 'center'
                }}
              >
                {config.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* Current Status Detail */}
      {isCancelled && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid', borderColor: 'grey.400' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CancelIcon color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              ❌ Заказ отменён
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {STATUS_CONFIG.CANCELLED.description}
          </Typography>
        </Box>
      )}

      {/* Current Status Detail */}
      {isDisputed && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DisputeIcon color="error" />
            <Typography variant="subtitle1" color="error" sx={{ fontWeight: 600 }}>
              ⚠️ Спор открыт
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {STATUS_CONFIG.DISPUTED.description}
          </Typography>
        </Box>
      )}

      {/* Status Info */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Как работает Escrow:</strong> Ваши средства блокируются на безопасном счёте и 
          переводятся исполнителю только после вашего подтверждения выполнения работы.
        </Typography>
      </Box>
    </Box>
  )
}

export default EscrowStateMachine
