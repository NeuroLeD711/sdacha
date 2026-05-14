from extensions import db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    balance = db.Column(db.Float, default=0.0, nullable=False)
    rating = db.Column(db.Float, default=0.0, nullable=False)
    total_reviews = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    projects_created = db.relationship('Project', backref='customer', lazy=True, foreign_keys='Project.customer_id')
    projects_accepted = db.relationship('Project', backref='contractor', lazy=True, foreign_keys='Project.contractor_id')
    bids = db.relationship('Bid', backref='contractor', lazy=True)
    messages_sent = db.relationship('Message', backref='sender', lazy=True, foreign_keys='Message.sender_id')
    reviews_given = db.relationship('Review', backref='reviewer', lazy=True, foreign_keys='Review.reviewer_id')
    reviews_received = db.relationship('Review', backref='reviewee', lazy=True, foreign_keys='Review.reviewee_id')
    escrow_accounts = db.relationship('EscrowAccount', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'balance': self.balance,
            'rating': round(self.rating, 2),
            'total_reviews': self.total_reviews,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    skills = db.Column(db.String(500), nullable=True)
    budget = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='CREATED', nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    contractor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    work_result = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    bids = db.relationship('Bid', backref='project', lazy=True, cascade='all, delete-orphan')
    escrow = db.relationship('EscrowAccount', backref='project', uselist=False, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='project', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='project', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'skills': self.skills,
            'budget': self.budget,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'customer_id': self.customer_id,
            'contractor_id': self.contractor_id,
            'work_result': self.work_result,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_detail_dict(self):
        data = self.to_dict()
        data['customer'] = self.customer.to_dict() if self.customer else None
        data['contractor'] = self.contractor.to_dict() if self.contractor else None
        data['bids'] = [bid.to_dict() for bid in self.bids] if self.bids else []
        return data


class Bid(db.Model):
    __tablename__ = 'bids'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    contractor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    cover_letter = db.Column(db.Text, nullable=False)
    proposed_price = db.Column(db.Float, nullable=False)
    proposed_days = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), default='PENDING', nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'contractor_id': self.contractor_id,
            'contractor': self.contractor.to_dict() if self.contractor else None,
            'cover_letter': self.cover_letter,
            'proposed_price': self.proposed_price,
            'proposed_days': self.proposed_days,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EscrowAccount(db.Model):
    __tablename__ = 'escrow_accounts'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='PENDING', nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    released_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'customer_id': self.customer_id,
            'amount': self.amount,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'released_at': self.released_at.isoformat() if self.released_at else None
        }


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'sender_id': self.sender_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'reviewer_id': self.reviewer_id,
            'reviewee_id': self.reviewee_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
