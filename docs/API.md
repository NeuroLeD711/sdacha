# API Спецификация

## Содержание
1. [Аутентификация](#аутентификация)
2. [Проекты](#проекты)
3. [Чат](#чат)
4. [Отзывы](#отзывы)
5. [Админ](#админ)
6. [Загрузки](#загрузки)

---

## Аутентификация

### Регистрация
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",    // required, unique
  "email": "string",       // required, unique  
  "password": "string",    // required, min 6 chars
  "role": "customer" | "contractor" | "admin"  // required
}

Response 201:
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "customer",
    "balance": 0.0,
    "rating": 0.0,
    "total_reviews": 0,
    "created_at": "2026-04-07T00:00:00+00:00"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}

Response 400: {"error": "All fields are required..."}
Response 409: {"error": "User with this username or email already exists"}
```

### Вход
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response 200:
{
  "user": {...},
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}

Response 401: {"error": "Invalid username or password"}
```

### Обновить токен
```
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

Response 200:
{
  "access_token": "eyJ..."
}
```

### Текущий пользователь
```
GET /api/auth/me
Authorization: Bearer <access_token>

Response 200:
{
  "user": {...}
}

Response 401: {"error": "Invalid token"}
```

### Пополнение баланса
```
POST /api/auth/topup
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 1000.0  // positive number
}

Response 200:
{
  "user": {...},
  "message": "Balance topped up by 1000.0"
}

Response 400: {"error": "Valid positive amount is required"}
```

---

## Проекты

### Список проектов (публичный)
```
GET /api/projects
Query params:
  - page: int (default 1)
  - per_page: int (default 20)
  - status: string (CREATED|PENDING_FUNDS|IN_PROGRESS|REVIEW)
  - category: string (partial match)
  - min_budget: float
  - max_budget: float
  - search: string (поиск по title и description)
  - sort: string (newest|oldest|budget_high|budget_low|deadline)

Response 200:
{
  "projects": [
    {
      "id": 1,
      "title": "string",
      "description": "string",
      "category": "string",
      "skills": "string",
      "budget": 1000.0,
      "deadline": "2026-04-15T00:00:00+00:00",
      "status": "CREATED",
      "customer_id": 1,
      "contractor_id": null,
      "work_result": null,
      "created_at": "2026-04-07T00:00:00+00:00",
      "updated_at": "2026-04-07T00:00:00+00:00"
    }
  ],
  "total": 10,
  "pages": 1,
  "current_page": 1
}
```

### Мои проекты
```
GET /api/projects/my
Authorization: Bearer <access_token>
Query params:
  - status: string (optional filter)

Response 200:
{
  "projects": [
    {
      // полный объект проекта с вложенными данными
      "customer": {...},
      "contractor": {...},
      "bids": [...]
    }
  ]
}
```

### Получить проект
```
GET /api/projects/<id>

Response 200:
{
  "project": {
    // полный объект с вложенными данными
  }
}

Response 404: {"error": "Project not found"}
```

### Создать проект
```
POST /api/projects
Authorization: Bearer <access_token> (только customer)
Content-Type: application/json

{
  "title": "string",        // required
  "description": "string", // required
  "category": "string",     // required
  "skills": "string",       // optional
  "budget": 1000.0,         // required, positive
  "deadline": "2026-05-01T00:00:00Z"  // ISO 8601, в будущем
}

Response 201:
{
  "project": {...},
  "message": "Project created successfully"
}

Response 400: {"error": "Deadline must be in the future"}
Response 403: {"error": "Only customers can create projects"}
```

### Взять проект напрямую (без ставки)
```
POST /api/projects/<id>/take
Authorization: Bearer <access_token> (только contractor)

Response 200:
{
  "project": {...},
  "escrow": {...},
  "message": "Project taken. Awaiting funds deposit."
}

Response 400: {"error": "Insufficient balance..."}
Response 403: {"error": "Only contractors can take projects"}
```

### Сделать ставку
```
POST /api/projects/<id>/bid
Authorization: Bearer <access_token> (только contractor)
Content-Type: application/json

{
  "cover_letter": "string",  // required
  "proposed_price": 900.0,   // optional, default = budget
  "proposed_days": 7         // optional
}

Response 201:
{
  "bid": {...},
  "message": "Bid placed successfully"
}

Response 400: {"error": "Can only bid on projects in CREATED status"}
```

### Принять ставку
```
POST /api/projects/<id>/accept-bid/<bid_id>
Authorization: Bearer <access_token> (только owner проекта)

Response 200:
{
  "project": {...},
  "escrow": {...},
  "message": "Bid accepted. Awaiting funds deposit."
}
```

### Депонировать средства
```
POST /api/projects/<id>/deposit
Authorization: Bearer <access_token> (только owner проекта)

Response 200:
{
  "project": {...},
  "escrow": {...},
  "message": "Funds deposited. Project started."
}
```

### Сдать работу
```
POST /api/projects/<id>/submit-work
Authorization: Bearer <access_token> (только contractor)
Content-Type: application/json

{
  "work_result": "string"  // required
}

Response 200:
{
  "project": {...},
  "message": "Work submitted for review"
}
```

### Завершить проект
```
POST /api/projects/<id>/complete
Authorization: Bearer <access_token> (только owner проекта)

Response 200:
{
  "project": {...},
  "escrow": {...},
  "message": "Project completed. Funds released to contractor."
}
```

### Открыть спор
```
POST /api/projects/<id>/dispute
Authorization: Bearer <access_token> (участник проекта)

Response 200:
{
  "project": {...},
  "message": "Project disputed by customer|contractor. Awaiting resolution."
}
```

### Разрешить спор
```
POST /api/projects/<id>/resolve-dispute
Authorization: Bearer <access_token> (только customer-владелец проекта)
Content-Type: application/json

{
  "action": "refund" | "release"
}

Response 200:
{
  "project": {...},
  "message": "Funds refunded to customer" | "Funds released to contractor"
}
```

### Отменить проект
```
POST /api/projects/<id>/cancel
Authorization: Bearer <access_token> (только owner)

Response 200:
{
  "project": {...},
  "message": "Project cancelled successfully."
}
```

---

## Чат

### Получить сообщения
```
GET /api/chat/<project_id>
Authorization: Bearer <access_token>

Чат доступен только участникам проекта в статусах:
PENDING_FUNDS, IN_PROGRESS, REVIEW, COMPLETED, DISPUTED.

Response 200:
{
  "messages": [
    {
      "id": 1,
      "project_id": 1,
      "sender_id": 1,
      "sender": {...},
      "content": "string",
      "created_at": "2026-04-07T00:00:00+00:00"
    }
  ],
  "project_id": 1
}

Response 403: {"error": "Chat is not available for this project"}
```

---

## Отзывы

### Создать отзыв
```
POST /api/reviews/project/<project_id>
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 5,      // 1-5
  "comment": "string"  // optional
}

Response 201:
{
  "review": {...},
  "message": "Review submitted successfully"
}
```

### Отзывы пользователя
```
GET /api/reviews/user/<user_id>

Response 200:
{
  "user": {...},
  "reviews": [...]
}
```

---

## Админ

### Статистика
```
GET /api/admin/stats
Authorization: Bearer <access_token> (только admin)

Response 200:
{
  "total_users": 10,
  "total_projects": 25,
  "active_projects": 5,
  "completed_projects": 15,
  "total_escrow_pending": 50000.0
}

Response 403: {"error": "Admin access required"}
```

---

## Загрузки

### Загрузить файл
```
POST /api/uploads
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <file>
project_id: <optional>

Response 200:
{
  "filename": "uuid.ext",
  "original_name": "document.pdf",
  "url": "/api/uploads/1/123/uuid.ext",
  "size": 1024,
  "type": "pdf"
}
```

### Получить файл
```
GET /api/uploads/<user_id>/[project_id]/<filename>
Authorization: Bearer <access_token>

Доступ:
- путь с project_id: только участники проекта;
- путь без project_id: только владелец файла.
```

---

## WebSocket События

### Подключение
```
SocketIO connect
Query: ?token=<jwt_token>
```

### Войти в комнату проекта
```
SocketIO: join_project
{ "project_id": 1 }

Response: { "status": "joined", "room": "project_1" }
```

### Отправить сообщение
```
SocketIO: send_message
{
  "project_id": 1,
  "content": "Hello!"
}

Response: { "status": "sent", "message": {...} }
```

### События
- `new_message` - новое сообщение в проекте
- `project_status_changed` - изменение статуса проекта

---

## Rate Limits

| Эндпоинт | Лимит |
|----------|-------|
| POST /api/auth/register | 5 в минуту |
| POST /api/auth/login | 10 в минуту |
| Другие API | 200 в день, 50 в час |

---

## Коды статусов проектов

| Статус | Описание | Переходы |
|--------|----------|----------|
| CREATED | Создан | → PENDING_FUNDS |
| PENDING_FUNDS | Ожидает оплаты | → IN_PROGRESS |
| IN_PROGRESS | В работе | → REVIEW |
| REVIEW | На проверке | → COMPLETED, DISPUTED |
| COMPLETED | Завершён | - |
| DISPUTED | Спор | → COMPLETED |
