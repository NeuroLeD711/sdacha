# Документация Фриланс-Эскроу

Полная документация проекта.

## Содержание

| Документ | Описание |
|----------|-----------|
| [API.md](API.md) | Спецификация API эндпоинтов, запросов и ответов |
| [DATABASE.md](DATABASE.md) | Модели данных, схемы связей, индексы |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Установка, запуск, конфигурация |
| [FUNCTIONAL.md](FUNCTIONAL.md) | Функциональные требования и сценарии |

## Быстрые ссылки

### API Endpoints
- `/api/auth/*` - Аутентификация
- `/api/projects/*` - Проекты
- `/api/chat/*` - Чат
- `/api/reviews/*` - Отзывы
- `/api/admin/*` - Администрирование
- `/api/uploads/*` - Файлы

### Статусы проектов
```
CREATED → PENDING_FUNDS → IN_PROGRESS → REVIEW → COMPLETED
                                            ↓
                                          DISPUTED → COMPLETED
```

### Тестовые аккаунты
- customer1 / password123 (баланс: 10000)
- contractor1 / password123 (баланс: 5000)
- contractor2 / password123 (баланс: 3000)

## Версия

- Backend: Flask 3.0.0, Python 3.10+
- Frontend: React 18, Vite, Redux Toolkit
- Database: SQLite (default) / PostgreSQL (production)