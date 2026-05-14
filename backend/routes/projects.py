from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, Bid, EscrowAccount, User
from datetime import datetime, timezone
from sqlalchemy import or_

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

VALID_TRANSITIONS = {
    'CREATED': ['PENDING_FUNDS'],
    'PENDING_FUNDS': ['IN_PROGRESS'],
    'IN_PROGRESS': ['REVIEW'],
    'REVIEW': ['COMPLETED', 'DISPUTED'],
    'COMPLETED': [],
    'DISPUTED': ['COMPLETED', 'CREATED'],
    'CANCELLED': []
}


def parse_deadline_iso(deadline_str):
    deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
    if deadline.tzinfo is None:
        return deadline.replace(tzinfo=timezone.utc)
    return deadline.astimezone(timezone.utc)


@projects_bp.route('', methods=['GET'])
def get_projects():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', None)
    category = request.args.get('category', None)
    min_budget = request.args.get('min_budget', None, type=float)
    max_budget = request.args.get('max_budget', None, type=float)
    search = request.args.get('search', None, type=str)
    sort = request.args.get('sort', 'newest', type=str)

    page = max(page, 1)
    per_page = min(max(per_page, 1), 100)
    query = Project.query.filter(Project.status.in_(['CREATED', 'PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW']))

    if status:
        query = query.filter(Project.status == status)
    if category:
        query = query.filter(Project.category.ilike(f'%{category}%'))
    if min_budget is not None:
        query = query.filter(Project.budget >= min_budget)
    if max_budget is not None:
        query = query.filter(Project.budget <= max_budget)
    if search:
        query = query.filter(
            or_(
                Project.title.ilike(f'%{search}%'),
                Project.description.ilike(f'%{search}%')
            )
        )

    if sort == 'oldest':
        query = query.order_by(Project.created_at.asc())
    elif sort == 'budget_high':
        query = query.order_by(Project.budget.desc(), Project.created_at.desc())
    elif sort == 'budget_low':
        query = query.order_by(Project.budget.asc(), Project.created_at.desc())
    elif sort == 'deadline':
        query = query.order_by(Project.deadline.asc(), Project.created_at.desc())
    else:
        query = query.order_by(Project.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'projects': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@projects_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_projects():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    status = request.args.get('status', None)

    if user.role == 'customer':
        query = Project.query.filter_by(customer_id=user_id)
    else:
        query = Project.query.filter_by(contractor_id=user_id)

    if status:
        query = query.filter(Project.status == status)

    projects = query.order_by(Project.created_at.desc()).all()
    return jsonify({'projects': [p.to_detail_dict() for p in projects]}), 200


@projects_bp.route('/<int:project_id>', methods=['GET'])
def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    return jsonify({'project': project.to_detail_dict()}), 200


@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role != 'customer':
        return jsonify({'error': 'Only customers can create projects'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', '').strip()
    skills = data.get('skills', '').strip()
    budget = data.get('budget')
    deadline_str = data.get('deadline', '')

    if not title or not description or not category or budget is None or not deadline_str:
        return jsonify({'error': 'title, description, category, budget, deadline are required'}), 400

    if not isinstance(budget, (int, float)) or budget <= 0:
        return jsonify({'error': 'Budget must be a positive number'}), 400

    try:
        deadline = parse_deadline_iso(deadline_str)
    except (ValueError, AttributeError):
        return jsonify({'error': 'Invalid deadline format. Use ISO 8601 (e.g. 2026-05-01T00:00:00)'}), 400

    if deadline <= datetime.now(timezone.utc):
        return jsonify({'error': 'Deadline must be in the future'}), 400

    project = Project(
        title=title,
        description=description,
        category=category,
        skills=skills,
        budget=budget,
        deadline=deadline,
        customer_id=user_id,
        status='CREATED'
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({'project': project.to_detail_dict(), 'message': 'Project created successfully'}), 201


@projects_bp.route('/<int:project_id>/take', methods=['POST'])
@jwt_required()
def take_project(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role != 'contractor':
        return jsonify({'error': 'Only contractors can take projects'}), 403

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status != 'CREATED':
        return jsonify({'error': 'Can only take projects in CREATED status'}), 400
    if project.contractor_id:
        return jsonify({'error': 'This project already has an assigned contractor'}), 400

    customer = User.query.get(project.customer_id)
    if customer.balance < project.budget:
        return jsonify({
            'error': f'Insufficient balance. Required: {project.budget}, Available: {customer.balance}'
        }), 400

    escrow = EscrowAccount(
        project_id=project_id,
        customer_id=project.customer_id,
        amount=project.budget,
        status='PENDING'
    )
    db.session.add(escrow)

    project.status = 'PENDING_FUNDS'
    project.contractor_id = user_id
    db.session.commit()

    return jsonify({
        'project': project.to_detail_dict(),
        'escrow': escrow.to_dict(),
        'message': 'Project taken. Awaiting funds deposit.'
    }), 200


@projects_bp.route('/<int:project_id>/bid', methods=['POST'])
@jwt_required()
def place_bid(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if user.role != 'contractor':
        return jsonify({'error': 'Only contractors can place bids'}), 403

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status != 'CREATED':
        return jsonify({'error': 'Can only bid on projects in CREATED status'}), 400

    existing_bid = Bid.query.filter_by(project_id=project_id, contractor_id=user_id).first()
    if existing_bid:
        return jsonify({'error': 'You have already placed a bid on this project'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    cover_letter = data.get('cover_letter', '').strip()
    proposed_price = data.get('proposed_price', project.budget)

    if not cover_letter:
        return jsonify({'error': 'cover_letter is required'}), 400
    if not isinstance(proposed_price, (int, float)) or proposed_price <= 0:
        return jsonify({'error': 'proposed_price must be a positive number'}), 400

    bid = Bid(
        project_id=project_id,
        contractor_id=user_id,
        cover_letter=cover_letter,
        proposed_price=proposed_price,
        proposed_days=data.get('proposed_days')
    )

    db.session.add(bid)
    db.session.commit()

    return jsonify({'bid': bid.to_dict(), 'message': 'Bid placed successfully'}), 201


@projects_bp.route('/<int:project_id>/accept-bid/<int:bid_id>', methods=['POST'])
@jwt_required()
def accept_bid(project_id, bid_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.customer_id != user_id:
        return jsonify({'error': 'Only the project owner can accept bids'}), 403
    if project.status != 'CREATED':
        return jsonify({'error': 'Can only accept bids on projects in CREATED status'}), 400

    bid = Bid.query.get(bid_id)
    if not bid or bid.project_id != project_id:
        return jsonify({'error': 'Bid not found'}), 404

    customer = User.query.get(user_id)
    if customer.balance < bid.proposed_price:
        return jsonify({
            'error': f'Insufficient balance. Required: {bid.proposed_price}, Available: {customer.balance}'
        }), 400

    project.status = 'PENDING_FUNDS'
    project.contractor_id = bid.contractor_id
    bid.status = 'ACCEPTED'

    for other_bid in Bid.query.filter_by(project_id=project_id).filter(Bid.id != bid_id).all():
        other_bid.status = 'REJECTED'

    escrow = EscrowAccount(
        project_id=project_id,
        customer_id=user_id,
        amount=bid.proposed_price,
        status='PENDING'
    )
    db.session.add(escrow)
    db.session.commit()

    return jsonify({
        'project': project.to_detail_dict(),
        'escrow': escrow.to_dict(),
        'message': 'Bid accepted. Awaiting funds deposit.'
    }), 200


@projects_bp.route('/<int:project_id>/deposit', methods=['POST'])
@jwt_required()
def deposit_funds(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.customer_id != user_id:
        return jsonify({'error': 'Only the project owner can deposit funds'}), 403
    if project.status != 'PENDING_FUNDS':
        return jsonify({'error': 'Project must be in PENDING_FUNDS status'}), 400

    escrow = EscrowAccount.query.filter_by(project_id=project_id).first()
    if not escrow:
        return jsonify({'error': 'Escrow account not found'}), 404

    customer = User.query.get(user_id)
    if customer.balance < escrow.amount:
        return jsonify({
            'error': f'Insufficient balance. Required: {escrow.amount}, Available: {customer.balance}'
        }), 400

    customer.balance -= escrow.amount
    escrow.status = 'FUNDED'
    project.status = 'IN_PROGRESS'

    db.session.commit()

    return jsonify({
        'project': project.to_detail_dict(),
        'escrow': escrow.to_dict(),
        'message': 'Funds deposited. Project started.'
    }), 200


@projects_bp.route('/<int:project_id>/submit-work', methods=['POST'])
@jwt_required()
def submit_work(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.contractor_id != user_id:
        return jsonify({'error': 'Only the assigned contractor can submit work'}), 403
    if project.status != 'IN_PROGRESS':
        return jsonify({'error': 'Can only submit work on projects in IN_PROGRESS status'}), 400

    data = request.get_json()
    work_result = data.get('work_result', '').strip() if data else ''
    if not work_result:
        return jsonify({'error': 'work_result is required'}), 400

    project.work_result = work_result
    project.status = 'REVIEW'
    db.session.commit()

    return jsonify({'project': project.to_detail_dict(), 'message': 'Work submitted for review'}), 200


@projects_bp.route('/<int:project_id>/complete', methods=['POST'])
@jwt_required()
def complete_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.customer_id != user_id:
        return jsonify({'error': 'Only the project owner can complete the project'}), 403
    if project.status != 'REVIEW':
        return jsonify({'error': 'Can only complete projects in REVIEW status'}), 400

    escrow = EscrowAccount.query.filter_by(project_id=project_id).first()
    amount = escrow.amount if escrow else project.budget

    contractor = User.query.get(project.contractor_id)
    if contractor:
        contractor.balance += amount
    if escrow:
        escrow.status = 'RELEASED'
        escrow.released_at = datetime.now(timezone.utc)
    project.status = 'COMPLETED'

    db.session.commit()

    return jsonify({
        'project': project.to_detail_dict(),
        'escrow': escrow.to_dict() if escrow else None,
        'message': 'Project completed. Funds released to contractor.'
    }), 200


@projects_bp.route('/<int:project_id>/dispute', methods=['POST'])
@jwt_required()
def dispute_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    is_customer = project.customer_id == user_id
    is_contractor = project.contractor_id == user_id
    
    if not is_customer and not is_contractor:
        return jsonify({'error': 'Only project participants can dispute'}), 403
    
    if project.status not in ('IN_PROGRESS', 'REVIEW'):
        return jsonify({'error': 'Can only dispute projects in IN_PROGRESS or REVIEW status'}), 400

    project.status = 'DISPUTED'
    db.session.commit()

    by_role = 'customer' if is_customer else 'contractor'
    return jsonify({
        'project': project.to_detail_dict(),
        'message': f'Project disputed by {by_role}. Awaiting resolution.'
    }), 200


@projects_bp.route('/<int:project_id>/resolve-dispute', methods=['POST'])
@jwt_required()
def resolve_dispute(project_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'customer':
        return jsonify({'error': 'Unauthorized'}), 403

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status != 'DISPUTED':
        return jsonify({'error': 'Project is not in DISPUTED status'}), 400
    if project.customer_id != user_id:
        return jsonify({'error': 'Only the project owner can resolve disputes'}), 403

    data = request.get_json(silent=True) or {}
    action = data.get('action', '')

    escrow = EscrowAccount.query.filter_by(project_id=project_id).first()
    amount = escrow.amount if escrow else project.budget

    if action == 'refund':
        customer = User.query.get(project.customer_id)
        customer.balance += amount
        if escrow:
            escrow.status = 'REFUNDED'
            escrow.released_at = datetime.now(timezone.utc)
        project.status = 'COMPLETED'
        db.session.commit()
        return jsonify({'project': project.to_detail_dict(), 'message': 'Funds refunded to customer'}), 200
    elif action == 'release':
        contractor = User.query.get(project.contractor_id)
        if contractor:
            contractor.balance += amount
        if escrow:
            escrow.status = 'RELEASED'
            escrow.released_at = datetime.now(timezone.utc)
        project.status = 'COMPLETED'
        db.session.commit()
        return jsonify({'project': project.to_detail_dict(), 'message': 'Funds released to contractor'}), 200
    else:
        return jsonify({'error': 'action must be "refund" or "release"'}), 400


@projects_bp.route('/<int:project_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_project(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.customer_id != user_id:
        return jsonify({'error': 'Only the project owner can cancel'}), 403
    if project.status not in ('CREATED', 'PENDING_FUNDS'):
        return jsonify({'error': 'Can only cancel projects in CREATED or PENDING_FUNDS status'}), 400

    if project.status == 'PENDING_FUNDS':
        escrow = EscrowAccount.query.filter_by(project_id=project_id).first()
        if escrow:
            db.session.delete(escrow)

    project.status = 'CANCELLED'
    db.session.commit()

    return jsonify({'project': project.to_detail_dict(), 'message': 'Project cancelled successfully.'}), 200
