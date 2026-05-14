# Развертывание

## Содержание
1. [Требования](#требования)
2. [Установка](#установка)
3. [Запуск](#запуск)
4. [Конфигурация](#конфигурация)
5. [Docker (опционально)](#docker-опционально)
6. [Troubleshooting](#troubleshooting)

---

## Требования

### Сервер
- Python 3.10+
- Node.js 18+
- SQLite (встроенный) или PostgreSQL для production

### Клиент
- Современный браузер с поддержкой ES6+
- React 18+ совместимые браузеры

---

## Установка

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd kursovoi
```

### 2. Backend

```bash
cd backend

# Создание виртуального окружения (Linux/macOS)
python3 -m venv venv
source venv/bin/activate

# Создание виртуального окружения (Windows)
python -m venv venv
venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt
```

### 3. Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Или если используется yarn
yarn install
```

---

## Запуск

### Режим разработки

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
# Сервер запустится на http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend запустится на http://localhost:5173
```

### Или использовать скрипт запуска

**Linux/macOS:**
```bash
chmod +x run.sh
./run.sh
```

**Windows:**
```cmd
run.bat
```

---

## Конфигурация

### Переменные окружения Backend

Создайте `.env` файл в папке `backend/`:

```bash
# Секретные ключи (ОБЯЗАТЕЛЬНО изменить для production!)
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# База данных
DATABASE_URL=sqlite:///freelance_escrow.db
# Для PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/escrow

# CORS (разделить запятой)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Socket.IO async mode (threading|eventlet|gevent)
SOCKETIO_ASYNC_MODE=threading
```

### Конфигурация Frontend

Создайте `.env` файл в папке `frontend/`:

```bash
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

---

## Скрипты

### Заполнение БД тестовыми данными
```bash
cd backend
python seed.py
```

Создаёт:
- 3 пользователей (1 заказчик, 2 исполнителя)
- 3 проекта
- Несколько ставок

### Создание админа
```bash
cd backend
python -c "
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    admin = User(username='admin', email='admin@test.com', role='admin')
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin created!')
"
```

---

## Docker (опционально)

### Dockerfile (Backend)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Dockerfile (Frontend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app

volumes:
  uploads:
```

---

## Troubleshooting

### Ошибка: "ModuleNotFoundError"
```bash
# Убедитесь что активировано виртуальное окружение
source venv/bin/activate
pip install -r requirements.txt
```

### Ошибка: "Port already in use"
```bash
# Найдите процесс и убейте его
lsof -i :5000
kill <PID>
```

### Ошибка: "CORS policy"
```bash
# Проверьте CORS_ORIGINS в конфигурации
# Должно быть: http://localhost:5173
```

### Ошибка: "Database is locked"
```bash
# SQLite не поддерживает множественные соединения
# Используйте check_same_thread=False в config
```

---

## Production сборка

### Backend
```bash
cd backend
# Запустить с WSGI сервером (gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend
```bash
cd frontend
npm run build
# Результат в dist/
```

---

## Структура папок

```
kursovoi/
├── backend/
│   ├── app.py           # Главное приложение
│   ├── models.py       # Модели БД
│   ├── config.py       # Конфигурация
│   ├── extensions.py   # Расширения Flask
│   ├── routes/         # API эндпоинты
│   ├── seed.py         # Тестовые данные
│   └── requirements.txt
├── frontend/
│   ├── src/            # Исходный код React
│   ├── dist/           # Собранный билд
│   ├── package.json
│   └── vite.config.js
├── docs/               # Документация
├── run.sh             # Запуск (Linux/macOS)
└── run.bat            # Запуск (Windows)
```
