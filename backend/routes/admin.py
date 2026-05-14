from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Project, Bid, EscrowAccount, Message, Review
from extensions import socketio

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    total_users = User.query.count()
    total_projects = Project.query.count()
    active_projects = Project.query.filter(
        Project.status.in_(['IN_PROGRESS', 'REVIEW'])
    ).count()
    completed_projects = Project.query.filter_by(status='COMPLETED').count()
    total_escrow = db.session.query(db.func.sum(EscrowAccount.amount)).filter(
        EscrowAccount.status.in_(['PENDING', 'FUNDED'])
    ).scalar() or 0

    return jsonify({
        'total_users': total_users,
        'total_projects': total_projects,
        'active_projects': active_projects,
        'completed_projects': completed_projects,
        'total_escrow_pending': total_escrow
    }), 200
