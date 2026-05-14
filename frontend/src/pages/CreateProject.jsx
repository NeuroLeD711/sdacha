import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createProject, clearError } from '../store/projectsSlice'
import {
  Container, Typography, Box, Paper, TextField, Button, Alert, Stepper, Step, StepLabel,
  Card, CardContent, Chip, Autocomplete, Grid, InputAdornment, Slider, Tooltip, IconButton
} from '@mui/material'
import {
  Title as TitleIcon, Description as DescIcon, Category as CatIcon,
  Build as SkillsIcon, AttachMoney as MoneyIcon, Event as ScheduleIcon, CheckCircle as CheckIcon
} from '@mui/icons-material'

const CATEGORIES = [
  { value: 'Web Development', label: 'Веб-разработка', icon: '🌐' },
  { value: 'Mobile Development', label: 'Мобильная разработка', icon: '📱' },
  { value: 'Design', label: 'Дизайн', icon: '🎨' },
  { value: 'Copywriting', label: 'Копирайтинг', icon: '✍️' },
  { value: 'Marketing', label: 'Маркетинг', icon: '📊' },
  { value: 'Bot Development', label: 'Разработка ботов', icon: '🤖' },
  { value: 'Data Science', label: 'Наука о данных', icon: '📈' },
  { value: 'DevOps', label: 'DevOps', icon: '⚙️' },
  { value: 'Video Production', label: 'Видеопроизводство', icon: '🎬' },
  { value: 'Audio Production', label: 'Аудиопроизводство', icon: '🎵' },
  { value: 'Other', label: 'Другое', icon: '📦' }
]

const SKILLS = {
  'Web Development': ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django', 'Flask', 'PHP', 'Laravel', 'HTML', 'CSS', 'SASS', 'Next.js', 'Nuxt.js', 'GraphQL', 'REST API'],
  'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'iOS', 'Android', 'Expo', 'Xamarin'],
  'Design': ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'UI/UX', 'Брендинг', 'Инфографика', 'Логотип'],
  'Copywriting': ['SEO-тексты', 'Нейминг', 'Сценарии', 'Пресс-релизы', 'SMM', 'Email-рассылки', 'Рерайтинг'],
  'Marketing': ['SMM', 'SEO', 'Контекстная реклама', 'Таргетинг', 'Аналитика', 'Контент-маркетинг', 'Email-маркетинг'],
  'Bot Development': ['Python', 'Aiogram', 'Telethon', 'Discord.py', 'Node.js', 'Discord API', 'Telegram API'],
  'Data Science': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'Machine Learning'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitLab', 'Ansible', 'Terraform', 'AWS', 'Linux'],
  'Video Production': ['Adobe Premiere', 'Final Cut', 'DaVinci Resolve', 'Монтаж', 'Моушн-дизайн', 'VFX', 'Анимация'],
  'Audio Production': ['Adobe Audition', 'Logic Pro', 'Ableton', 'Сведение', 'Мастеринг', 'Саунд-дизайн'],
  'Other': ['WordPress', '1С-Битрикс', 'CRM', 'ERP', 'Техническая поддержка', 'Консультация']
}

const BUDGET_PRESETS = [
  { label: 'До 1 000 ₽', value: 1000 },
  { label: '1 000 - 5 000 ₽', value: 3000 },
  { label: '5 000 - 15 000 ₽', value: 10000 },
  { label: '15 000 - 50 000 ₽', value: 30000 },
  { label: '50 000 - 100 000 ₽', value: 75000 },
  { label: 'Более 100 000 ₽', value: 150000 }
]

const steps = [
  { label: 'Основное', icon: TitleIcon },
  { label: 'Описание', icon: DescIcon },
  { label: 'Навыки', icon: SkillsIcon },
  { label: 'Бюджет и сроки', icon: MoneyIcon },
  { label: 'Проверка', icon: CheckIcon }
]

const CreateProject = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.projects)
  const { user } = useSelector((state) => state.auth)

  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    skills: [],
    budget: 5000,
    deadline_days: 7,
    requirements: '',
    deliverables: ''
  })
  const [validation, setValidation] = useState({})

  if (user?.role !== 'customer') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Только заказчики могут создавать заказы.
        </Alert>
      </Container>
    )
  }

  const validateStep = (step) => {
    const errors = {}
    if (step === 0 && !form.title.trim()) {
      errors.title = 'Введите заголовок проекта'
    }
    if (step === 1) {
      if (!form.description.trim()) errors.description = 'Опишите задачу'
      else if (form.description.length < 50) errors.description = 'Описание должно быть более подробным (минимум 50 символов)'
      if (!form.requirements.trim()) errors.requirements = 'Укажите требования'
    }
    if (step === 2 && form.skills.length === 0) {
      errors.skills = 'Выберите хотя бы один навык'
    }
    if (step === 3) {
      if (form.budget < 100) errors.budget = 'Минимальный бюджет — 100 ₽'
      if (form.deadline_days < 1) errors.deadline = 'Укажите срок выполнения'
    }
    setValidation(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = () => {
    if (!validateStep(3)) return
    dispatch(clearError())
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + form.deadline_days)
    
    const payload = {
      title: form.title.trim(),
      description: `${form.description.trim()}\n\n📋 Требования:\n${form.requirements.trim()}\n\n✅ Что нужно сдать:\n${form.deliverables.trim()}`,
      category: form.category,
      skills: form.skills.join(','),
      budget: parseFloat(form.budget),
      deadline: deadline.toISOString()
    }
    dispatch(createProject(payload)).unwrap().then(() => navigate('/')).catch(() => {})
  }

  const categorySkills = form.category ? (SKILLS[form.category] || []) : []

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        📋 Конструктор технического задания
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Пошагово опишите вашу задачу. Это поможет исполнителям лучше понять требования и избежать споров.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((s, idx) => (
            <Step key={idx}>
              <StepLabel StepIconComponent={() => (
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: idx <= activeStep ? 'primary.main' : 'grey.300',
                  color: idx <= activeStep ? 'white' : 'grey.600',
                  fontWeight: 600, fontSize: 14
                }}>
                  {idx < activeStep ? '✓' : idx + 1}
                </Box>
              )}>
                {s.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Title & Category */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Заголовок проекта"
              placeholder="Например: Разработать лендинг для кофейни"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={!!validation.title}
              helperText={validation.title || 'Кратко опишите суть задачи в одном предложении'}
              inputProps={{ maxLength: 200 }}
              fullWidth
              autoFocus
            />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Выберите категорию</Typography>
            <Grid container spacing={2}>
              {CATEGORIES.map((cat) => (
                <Grid item xs={6} sm={4} md={3} key={cat.value}>
                  <Card
                    onClick={() => setForm({ ...form, category: cat.value })}
                    sx={{
                      cursor: 'pointer',
                      border: form.category === cat.value ? '2px solid' : '1px solid',
                      borderColor: form.category === cat.value ? 'primary.main' : 'divider',
                      bgcolor: form.category === cat.value ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>{cat.icon}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: form.category === cat.value ? 700 : 400 }}>
                        {cat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 1: Description */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Подробное описание задачи"
              placeholder="Опишите задачу максимально подробно..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              error={!!validation.description}
              helperText={validation.description || `${form.description.length}/2000 символов (минимум 50)`}
              multiline rows={5}
              fullWidth
              autoFocus
            />
            <TextField
              label="Технические требования"
              placeholder="Например: Адаптивный дизайн, кроссбраузерность, оптимизация под SEO..."
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              error={!!validation.requirements}
              helperText={validation.requirements || 'Что должно быть реализовано? Какие технологии использовать?'}
              multiline rows={3}
              fullWidth
            />
            <TextField
              label="Что нужно сдать"
              placeholder="Например: Исходный код, макеты в Figma, документация..."
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              helperText="Что должен предоставить исполнитель по завершении"
              multiline rows={2}
              fullWidth
            />
          </Box>
        )}

        {/* Step 2: Skills */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Выберите категорию в шаге 1, чтобы увидеть релевантные навыки
              </Typography>
              {form.category ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Категория: {form.category} — выберите необходимые навыки ниже
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Сначала выберите категорию на шаге 1
                </Alert>
              )}
            </Box>
            
            {form.category && (
              <Autocomplete
                multiple
                options={categorySkills}
                value={form.skills}
                onChange={(e, val) => setForm({ ...form, skills: val })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} key={option} color="primary" />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Требуемые навыки"
                    placeholder="Например: React, JavaScript, Figma..."
                    error={!!validation.skills}
                    helperText={validation.skills || `${form.skills.length} навыков выбрано`}
                  />
                )}
              />
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                💡 Совет: Выбирайте только релевантные навыки — это поможет найти подходящего исполнителя быстрее
              </Typography>
            </Box>
          </Box>
        )}

        {/* Step 3: Budget & Timeline */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                💰 Бюджет проекта
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {BUDGET_PRESETS.map((preset) => (
                  <Grid item xs={6} sm={4} key={preset.label}>
                    <Card
                      onClick={() => setForm({ ...form, budget: preset.value })}
                      sx={{
                        cursor: 'pointer',
                        border: form.budget === preset.value ? '2px solid' : '1px solid',
                        borderColor: form.budget === preset.value ? 'primary.main' : 'divider',
                        bgcolor: form.budget === preset.value ? 'primary.50' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: form.budget === preset.value ? 700 : 400 }}>
                          {preset.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ px: 2 }}>
                <Typography gutterBottom>
                  Или укажите точную сумму: <strong>{form.budget.toLocaleString('ru-RU')} ₽</strong>
                </Typography>
                <Slider
                  value={form.budget}
                  onChange={(e, val) => setForm({ ...form, budget: val })}
                  min={100}
                  max={500000}
                  step={100}
                  marks={[
                    { value: 100, label: '100₽' },
                    { value: 50000, label: '50K' },
                    { value: 100000, label: '100K' },
                    { value: 500000, label: '500K' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v.toLocaleString('ru-RU')} ₽`}
                />
              </Box>
              {validation.budget && <Alert severity="error" sx={{ mt: 1 }}>{validation.budget}</Alert>}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                📅 Срок выполнения
              </Typography>
              <Grid container spacing={2}>
                {[1, 3, 7, 14, 30, 60].map((days) => (
                  <Grid item xs={4} sm={2} key={days}>
                    <Card
                      onClick={() => setForm({ ...form, deadline_days: days })}
                      sx={{
                        cursor: 'pointer',
                        border: form.deadline_days === days ? '2px solid' : '1px solid',
                        borderColor: form.deadline_days === days ? 'primary.main' : 'divider',
                        bgcolor: form.deadline_days === days ? 'primary.50' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="h6">{days}</Typography>
                        <Typography variant="caption">{days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Крайний срок: <strong>{new Date(Date.now() + form.deadline_days * 86400000).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </Typography>
            </Box>
          </Box>
        )}

        {/* Step 4: Review */}
        {activeStep === 4 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Проверьте данные перед публикацией. Вы всегда сможете отредактировать заказ до начала работы.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Заголовок</Typography>
                    <Typography variant="h6">{form.title}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Категория</Typography>
                    <Typography variant="h6">{form.category}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Описание</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{form.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Навыки</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {form.skills.map((s) => <Chip key={s} label={s} size="small" />)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Бюджет</Typography>
                    <Typography variant="h4" color="success.main">
                      {form.budget.toLocaleString('ru-RU')} ₽
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ bgcolor: 'info.50' }}>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Срок</Typography>
                    <Typography variant="h4" color="info.main">
                      {form.deadline_days} {form.deadline_days === 1 ? 'день' : form.deadline_days < 5 ? 'дня' : 'дней'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              💡 Средства будут заблокированы на escrow-счёте после выбора исполнителя и перевода в статус «В работе». 
              Это гарантирует безопасность для обеих сторон.
            </Alert>
          </Box>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
            ← Назад
          </Button>
          {activeStep < 4 ? (
            <Button onClick={handleNext} variant="contained" size="large">
              Далее →
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" color="success" size="large" disabled={loading}>
              {loading ? 'Публикация...' : '🎯 Опубликовать заказ'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default CreateProject
