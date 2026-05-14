"""
Seed script to populate the database with test data.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Project, Bid, EscrowAccount
from datetime import datetime, timezone, timedelta


def seed():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        customer = User(username='customer1', email='customer@test.com', role='customer')
        customer.set_password('password123')
        customer.balance = 10000.0

        contractor = User(username='contractor1', email='contractor@test.com', role='contractor')
        contractor.set_password('password123')
        contractor.balance = 5000.0

        contractor2 = User(username='contractor2', email='contractor2@test.com', role='contractor')
        contractor2.set_password('password123')
        contractor2.balance = 3000.0

        db.session.add_all([customer, contractor, contractor2])
        db.session.commit()

        project1 = Project(
            title='Разработка лендинга',
            description='Создать одностраничный сайт для кофейни с адаптивным дизайном',
            category='Web Development',
            skills='HTML,CSS,JavaScript,React',
            budget=15000.0,
            deadline=datetime.now(timezone.utc) + timedelta(days=14),
            customer_id=customer.id,
            status='CREATED'
        )

        project2 = Project(
            title='Дизайн логотипа',
            description='Разработать логотип для IT-компании в минималистичном стиле',
            category='Design',
            skills='Figma,Photoshop,Illustrator',
            budget=5000.0,
            deadline=datetime.now(timezone.utc) + timedelta(days=7),
            customer_id=customer.id,
            status='CREATED'
        )

        project3 = Project(
            title='Telegram-бот для магазина',
            description='Бот для приёма заказов и уведомлений',
            category='Bot Development',
            skills='Python,Aiogram,SQLite',
            budget=8000.0,
            deadline=datetime.now(timezone.utc) + timedelta(days=10),
            customer_id=customer.id,
            status='CREATED'
        )

        db.session.add_all([project1, project2, project3])
        db.session.commit()

        bid1 = Bid(
            project_id=project1.id,
            contractor_id=contractor.id,
            cover_letter='Опыт в React 3 года. Готов выполнить за 10 дней.',
            proposed_price=14000.0,
            proposed_days=10
        )

        bid2 = Bid(
            project_id=project1.id,
            contractor_id=contractor2.id,
            cover_letter='Сделаю быстро и качественно.',
            proposed_price=13000.0,
            proposed_days=12
        )

        bid3 = Bid(
            project_id=project2.id,
            contractor_id=contractor.id,
            cover_letter='Портфолио с логотипами приложу по запросу.',
            proposed_price=5000.0,
            proposed_days=5
        )

        db.session.add_all([bid1, bid2, bid3])
        db.session.commit()

        print('=== Seed data created ===')
        print(f'Customer: {customer.username} / password123 (balance: {customer.balance})')
        print(f'Contractor: {contractor.username} / password123 (balance: {contractor.balance})')
        print(f'Contractor2: {contractor2.username} / password123 (balance: {contractor2.balance})')
        print(f'Project 1: {project1.title} (status: {project1.status})')
        print(f'Project 2: {project2.title} (status: {project2.status})')
        print(f'Project 3: {project3.title} (status: {project3.status})')
        print(f'Bids on Project 1: {bid1.proposed_price} ({contractor.username}), {bid2.proposed_price} ({contractor2.username})')
        print(f'Bids on Project 2: {bid3.proposed_price} ({contractor.username})')
        print('=========================')


if __name__ == '__main__':
    seed()
