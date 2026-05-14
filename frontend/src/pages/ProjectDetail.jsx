import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchProject, takeProject, submitWork,
  completeProject, disputeProject, resolveDispute, cancelProject, clearError,
  placeBid, acceptBid
} from '../store/projectsSlice'
import EscrowStateMachine from '../components/EscrowStateMachine'
import FileUpload from '../components/FileUpload'
import {
  Typography, Box, Paper, Chip, Button, TextField,
  Divider, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Avatar, Rating, CircularProgress, Snackbar, Card, CardContent
} from '@mui/material'
import {
  CheckCircle as AcceptIcon,
  Warning as DisputeIcon, Send as SendIcon,
  Handshake as TakeIcon
} from '@mui/icons-material'

const ProjectDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentProject, loading, error } = useSelector((state) => state.projects)
  const { user } = useSelector((state) => state.auth)
  const canChat = ['PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DISPUTED'].includes(currentProject?.status) &&
    (user?.id === currentProject?.customer_id || user?.id === currentProject?.contractor_id)
  
  const [workResult, setWorkResult] = useState('')
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [justTaken, setJustTaken] = useState(false)
  
  // BID state
  const [bidDialogOpen, setBidDialogOpen] = useState(false)
  const [bidCoverLetter, setBidCoverLetter] = useState('')
  const [bidPrice, setBidPrice] = useState('')
  const [bidDays, setBidDays] = useState('')
  const [placingBid, setPlacingBid] = useState(false)
  
  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    dispatch(fetchProject(id))
    return () => dispatch(clearError())
  }, [dispatch, id])

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handlePlaceBid = () => {
    setPlacingBid(true)
    dispatch(placeBid({
      projectId: id,
      coverLetter: bidCoverLetter,
      proposedPrice: parseFloat(bidPrice) || currentProject?.budget,
      proposedDays: bidDays ? parseInt(bidDays) : null
    })).unwrap().then(() => {
      showSnackbar('Ставка подана!')
      setBidDialogOpen(false)
      setBidCoverLetter('')
      setBidPrice('')
      setBidDays('')
      dispatch(fetchProject(id))
    }).catch((err) => {
      showSnackbar(err || 'Ошибка подачи ставки', 'error')
    }).finally(() => setPlacingBid(false))
  }

  const handleAcceptBid = (bidId) => {
    dispatch(acceptBid({ projectId: id, bidId })).unwrap().then(() => {
      showSnackbar('Ставка принята!')
      dispatch(fetchProject(id))
    }).catch((err) => {
      showSnackbar(err || 'Ошибка', 'error')
    })
  }

  const handleAction = (action, msg) => {
    setConfirmAction(action)
    setConfirmMsg(msg)
    setConfirmOpen(true)
  }

  const executeAction = () => {
    setConfirmOpen(false)
    
    if (confirmAction === 'take') {
      dispatch(takeProject(id))
        .unwrap().then(() => {
          showSnackbar('Заказ принят!')
          setJustTaken(true)
        }).catch(() => {})
    }
    else if (confirmAction === 'submit') {
      dispatch(submitWork({ projectId: id, workResult }))
        .unwrap().then(() => {
          showSnackbar('Работа отправлена!')
          setWorkResult('')
        }).catch(() => {})
    }
    else if (confirmAction === 'complete') {
      dispatch(completeProject(id))
        .unwrap().then(() => showSnackbar('Проект завершён!'))
        .catch(() => {})
    }
    else if (confirmAction === 'dispute') {
      dispatch(disputeProject(id))
        .unwrap().then(() => showSnackbar('Спор открыт.'))
        .catch(() => {})
    }
    else if (confirmAction === 'resolve_refund') {
      dispatch(resolveDispute({ projectId: id, action: 'refund' }))
        .unwrap().then(() => showSnackbar('Средства возвращены.'))
        .catch(() => {})
    }
    else if (confirmAction === 'resolve_release') {
      dispatch(resolveDispute({ projectId: id, action: 'release' }))
        .unwrap().then(() => showSnackbar('Средства переведены.'))
        .catch(() => {})
    }
    else if (confirmAction === 'cancel') {
      dispatch(cancelProject(id))
        .unwrap().then(() => showSnackbar('Заказ отменён.'))
        .catch(() => {})
    }
  }

  if (!currentProject && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!currentProject) {
    return <Alert severity="error">Проект не найден</Alert>
  }

  const p = currentProject
  const isCustomer = user?.id === p.customer_id
  const isContractor = user?.role === 'contractor'

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{p.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={p.category} color="primary" size="small" />
              {p.skills?.split(',').slice(0, 4).map((s, i) => (
                <Chip key={i} label={s.trim()} variant="outlined" size="small" />
              ))}
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {p.budget.toLocaleString('ru-RU')} ₽
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Дедлайн: {new Date(p.deadline).toLocaleDateString('ru-RU')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 3 }}>
          <EscrowStateMachine status={p.status} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">📝 Описание</Typography>
                <Button size="small" onClick={() => setDetailsExpanded(!detailsExpanded)}>
                  {detailsExpanded ? 'Скрыть' : 'Подробнее'}
                </Button>
              </Box>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {detailsExpanded ? p.description : p.description?.slice(0, 500)}
                {!detailsExpanded && p.description?.length > 500 && '...'}
              </Typography>
            </Box>
          </Paper>

          {/* СПИСОК СТАВОК - для заказчика */}
          {isCustomer && p.status === 'CREATED' && p.bids && p.bids.length > 0 && (
            <Paper sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>📋 Полученные ставки ({p.bids.length})</Typography>
                <Divider sx={{ mb: 2 }} />
                {p.bids.map((bid) => (
                  <Card key={bid.id} sx={{ mb: 2, bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                              {bid.contractor?.username?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {bid.contractor?.username}
                            </Typography>
                            <Rating value={bid.contractor?.rating || 0} readOnly size="small" />
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>{bid.cover_letter}</Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip label={`${bid.proposed_price?.toLocaleString('ru-RU')} ₽`} color="primary" size="small" />
                            {bid.proposed_days && <Chip label={`${bid.proposed_days} дн.`} variant="outlined" size="small" />}
                          </Box>
                        </Box>
                        {bid.status === 'PENDING' && (
                          <Button variant="contained" color="success" onClick={() => handleAcceptBid(bid.id)}>
                            Принять
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          )}

          {/* ФОРМА ПОДАЧИ СТАВКИ - для исполнителя */}
          {isContractor && p.status === 'CREATED' && !p.contractor_id && (
            <Paper sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main', bgcolor: 'warning.50' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>💰 Подать ставку</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Предложите свою цену и срок выполнения.
                </Alert>
                
                {!bidDialogOpen ? (
                  <Button variant="contained" color="warning" onClick={() => setBidDialogOpen(true)}>
                    Подать ставку
                  </Button>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Ваша цена" type="number" value={bidPrice}
                          onChange={(e) => setBidPrice(e.target.value)} placeholder={String(p.budget)} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Срок (дней)" type="number" value={bidDays}
                          onChange={(e) => setBidDays(e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={3} label="Сопроводительное письмо" value={bidCoverLetter}
                          onChange={(e) => setBidCoverLetter(e.target.value)}
                          placeholder="Опишите ваш опыт..." />
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button variant="contained" color="warning" onClick={handlePlaceBid}
                        disabled={placingBid || !bidCoverLetter}>
                        {placingBid ? '...' : 'Отправить'}
                      </Button>
                      <Button variant="outlined" onClick={() => setBidDialogOpen(false)}>Отмена</Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* КНОПКА "ВЗЯТЬ ЗАКАЗ" для исполнителя */}
          {isContractor && p.status === 'CREATED' && !p.contractor_id && !bidDialogOpen && (
            <Paper sx={{ mb: 3, border: '2px solid', borderColor: 'success.main', bgcolor: 'success.50' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="success.main" gutterBottom>🎯 Доступно!</Typography>
                <Button variant="contained" color="success" size="large" startIcon={<TakeIcon />}
                  onClick={() => handleAction('take', 'Взять заказ?')}>
                  Взять заказ
                </Button>
              </Box>
            </Paper>
          )}

          {/* Результат работы */}
          {p.work_result && (
            <Paper sx={{ mb: 3, border: '2px solid', borderColor: 'secondary.main' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="secondary" gutterBottom>✅ Результат</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{p.work_result}</Typography>
                </Paper>
              </Box>
            </Paper>
          )}

          {/* СДАЧА РАБОТЫ - для исполнителя */}
          {(isContractor && user?.id === p.contractor_id) && 
           (p.status === 'IN_PROGRESS' || p.status === 'PENDING_FUNDS' || justTaken) && (
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>📤 Сдача работы</Typography>
                {!justTaken && p.status === 'PENDING_FUNDS' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Ожидается депонирование средств заказчиком. После подтверждения оплаты можно будет сдать работу.
                  </Alert>
                )}
                {(justTaken || p.status === 'IN_PROGRESS') && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Заказ принят! Средства заморожены. Можно сдавать работу.
                  </Alert>
                )}
                <FileUpload projectId={p.id} onFilesChange={(files) => {
                  if (files.length > 0) {
                    const links = files.map(f => `[${f.name}](${f.url})`).join('\n')
                    setWorkResult(prev => prev ? prev + '\n\n' + links : links)
                  }
                }} />
                <TextField fullWidth multiline rows={4} label="Описание" value={workResult}
                  onChange={(e) => setWorkResult(e.target.value)} sx={{ mt: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" color="info" startIcon={<SendIcon />}
                    onClick={() => handleAction('submit', 'Отправить на проверку?')}
                    disabled={!workResult || p.status === 'PENDING_FUNDS'}>
                    {p.status === 'PENDING_FUNDS' ? 'После оплаты' : 'Отправить'}
                  </Button>
                  <Button variant="outlined" color="warning" startIcon={<DisputeIcon />}
                    onClick={() => handleAction('dispute', 'Открыть спор?')}>
                    Оспорить
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* ПРОВЕРКА РАБОТЫ - для заказчика */}
          {isCustomer && p.status === 'REVIEW' && (
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>🔍 Проверка</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" color="success" startIcon={<AcceptIcon />}
                    onClick={() => handleAction('complete', 'Подтвердить?')}
                  >
                    Принять
                  </Button>
                  <Button variant="contained" color="warning" startIcon={<DisputeIcon />}
                    onClick={() => handleAction('dispute', 'Открыть спор?')}>
                    Оспорить
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Спор */}
          {p.status === 'DISPUTED' && (
            <Paper sx={{ mb: 3, border: '2px solid', borderColor: 'error.main' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="error" gutterBottom>⚠️ Спор</Typography>
                {isCustomer && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={() => handleAction('resolve_release', 'Перевести?')}>
                      Перевести
                    </Button>
                    <Button variant="contained" color="warning" onClick={() => handleAction('resolve_refund', 'Вернуть?')}>
                      Вернуть
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Завершен или отменен */}
          {(p.status === 'COMPLETED' || p.status === 'CANCELLED') && (
            <Paper sx={{ mb: 3, bgcolor: p.status === 'CANCELLED' ? 'grey.100' : 'success.50' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color={p.status === 'CANCELLED' ? 'text.secondary' : 'success.main'}>
                  {p.status === 'CANCELLED' ? '❌ Заказ отменён' : '🎉 Завершён'}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Отмена */}
          {isCustomer && p.status === 'CREATED' && (
            <Button variant="outlined" color="error" onClick={() => handleAction('cancel', 'Отменить?')}>
              Отменить заказ
            </Button>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>👥 Участники</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="overline" color="text.secondary">Заказчик</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {p.customer?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">{p.customer?.username}</Typography>
                    <Rating value={p.customer?.rating || 0} readOnly size="small" />
                  </Box>
                </Box>
              </Box>
              {p.contractor && (
                <Box>
                  <Typography variant="overline" color="text.secondary">Исполнитель</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {p.contractor?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{p.contractor?.username}</Typography>
                      <Rating value={p.contractor?.rating || 0} readOnly size="small" />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>ℹ️ Информация</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">ID</Typography>
                  <Typography>#{p.id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Дедлайн</Typography>
                  <Typography>{new Date(p.deadline).toLocaleDateString('ru-RU')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Бюджет</Typography>
                  <Typography color="primary" sx={{ fontWeight: 600 }}>
                    {p.budget.toLocaleString('ru-RU')} ₽
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {canChat && (
            <Button variant="contained" color="secondary" fullWidth component={Link} to={`/chat/${p.id}`}>
              💬 Чат проекта
            </Button>
          )}
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>⚠️ Подтверждение</DialogTitle>
        <DialogContent>
          <Typography>{confirmMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button onClick={executeAction} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message} />
    </Box>
  )
}

export default ProjectDetail
