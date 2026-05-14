# База данных

## Содержание
1. [Модели данных](#модели-данных)
2. [Схема связей](#схема-связей)
3. [Индексы](#индексы)

---

## Модели данных

### User (Пользователь)
```python
class User(db.Model):
    id: Integer, PK
    username: String(80), unique, indexed
    email: String(120), unique, indexed
    password_hash: String(256)
    role: String(20)  # customer | contractor | admin
    balance: Float, default=0.0
    rating: Float, default=0.0
    total_reviews: Integer, default=0
    created_at: DateTime
```

**Связи:**
- `projects_created` → Project (many, foreign_key=customer_id)
- `projects_accepted` → Project (many, foreign_key=contractor_id)
- `bids` → Bid (many)
- `messages_sent` → Message (many)
- `reviews_given` → Review (many)
- `reviews_received` → Review (many)
- `escrow_accounts` → EscrowAccount (many)

### Project (Проект)
```python
class Project(db.Model):
    id: Integer, PK
    title: String(200)
    description: Text
    category: String(100)
    skills: String(500)
    budget: Float
    deadline: DateTime
    status: String(20), indexed  # CREATED|PENDING_FUNDS|IN_PROGRESS|REVIEW|COMPLETED|DISPUTED
    customer_id: Integer, FK → User.id
    contractor_id: Integer, FK → User.id, nullable
    work_result: Text, nullable
    created_at: DateTime
    updated_at: DateTime
```

**Связи:**
- `customer` → User (one)
- `contractor` → User (one)
- `bids` → Bid (many, cascade delete)
- `escrow` → EscrowAccount (one, cascade delete)
- `messages` → Message (many, cascade delete)
- `reviews` → Review (many, cascade delete)

### Bid (Ставка)
```python
class Bid(db.Model):
    id: Integer, PK
    project_id: Integer, FK → Project.id
    contractor_id: Integer, FK → User.id
    cover_letter: Text
    proposed_price: Float
    proposed_days: Integer, nullable
    status: String(20)  # PENDING|ACCEPTED|REJECTED
    created_at: DateTime
```

**Связи:**
- `project` → Project (one)
- `contractor` → User (one)

### EscrowAccount (Эскроу счёт)
```python
class EscrowAccount(db.Model):
    id: Integer, PK
    project_id: Integer, FK → Project.id, unique
    customer_id: Integer, FK → User.id
    amount: Float
    status: String(20)  # PENDING|FUNDED|RELEASED|REFUNDED
    created_at: DateTime
    released_at: DateTime, nullable
```

**Связи:**
- `project` → Project (one)
- `user` → User (one)

### Message (Сообщение)
```python
class Message(db.Model):
    id: Integer, PK
    project_id: Integer, FK → Project.id
    sender_id: Integer, FK → User.id
    content: Text
    created_at: DateTime
```

**Связи:**
- `project` → Project (one)
- `sender` → User (one)

### Review (Отзыв)
```python
class Review(db.Model):
    id: Integer, PK
    project_id: Integer, FK → Project.id
    reviewer_id: Integer, FK → User.id
    reviewee_id: Integer, FK → User.id
    rating: Integer  # 1-5
    comment: Text, nullable
    created_at: DateTime
```

**Связи:**
- `project` → Project (one)
- `reviewer` → User (one)
- `reviewee` → User (one)

---

## Схема связей

```
User (1) ─────────┬───────── (N) Project (как customer)
                 │
                 ├───────── (N) Project (как contractor)
                 │
                 ├───────── (N) Bid
                 │
                 ├───────── (N) Message
                 │
                 ├───────── (N) Review (reviewer)
                 │
                 └───────── (N) Review (reviewee)

Project (1) ─────┬───────── (N) Bid
                 │
                 ├───────── (1) EscrowAccount
                 │
                 ├───────── (N) Message
                 │
                 └───────── (N) Review
```

---

## Индексы

| Таблица | Колонка | Тип индекса |
|---------|---------|-------------|
| users | username | B-tree (unique) |
| users | email | B-tree (unique) |
| projects | status | B-tree |
| projects | customer_id | B-tree |
| projects | contractor_id | B-tree |
| bids | project_id | B-tree |
| bids | contractor_id | B-tree |
| escrow_accounts | project_id | B-tree (unique) |
| messages | project_id | B-tree |
| reviews | project_id | B-tree |
| reviews | reviewee_id | B-tree |

---

## Статусы

### Project Status
| Статус | Описание |
|--------|-----------|
| CREATED | Проект создан, открыт для ставок |
| PENDING_FUNDS | Ставка принята, ожидает депонирования |
| IN_PROGRESS | Средства депонированы, работа ведётся |
| REVIEW | Работа сдана, заказчик проверяет |
| COMPLETED | Проект завершён |
| DISPUTED | Открыт спор |

### Bid Status
| Статус | Описание |
|--------|-----------|
| PENDING | Ставка на рассмотрении |
| ACCEPTED | Ставка принята |
| REJECTED | Ставка отклонена |

### Escrow Status
| Статус | Описание |
|--------|-----------|
| PENDING | Ожидает пополнения |
| FUNDED | Средства зачислены |
| RELEASED | Средства переведены исполнителю |
| REFUNDED | Средства возвращены заказчику |

---

## Примеры запросов (SQLAlchemy)

### Получить все активные проекты с заказчиком
```python
projects = Project.query.filter(
    Project.status.in_(['CREATED', 'PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW'])
).join(User, Project.customer_id == User.id).all()
```

### Получить все ставки проекта
```python
bids = Bid.query.filter_by(project_id=project_id).order_by(Bid.created_at.desc()).all()
```

### Получить статистику пользователя
```python
user = User.query.get(user_id)
avg_rating = user.rating
total_reviews = user.total_reviews
```

### Сумма средств в эскроу
```python
from sqlalchemy import func
total = db.session.query(func.sum(EscrowAccount.amount)).filter(
    EscrowAccount.status.in_(['PENDING', 'FUNDED'])
).scalar()
```