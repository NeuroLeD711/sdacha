from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Message, Project

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
CHAT_AVAILABLE_STATUSES = ('PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DISPUTED')


def _to_int_or_none(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_project_participant(project, user_id):
    uid = _to_int_or_none(user_id)
    if uid is None:
        return False
    customer_id = _to_int_or_none(project.customer_id)
    contractor_id = _to_int_or_none(project.contractor_id)
    return uid in (customer_id, contractor_id)


@chat_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_messages(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status not in CHAT_AVAILABLE_STATUSES:
        return jsonify({
            'error': f'Chat is not available for project status {project.status}'
        }), 403
    if not _is_project_participant(project, user_id):
        return jsonify({
            'error': 'Access denied: only customer or assigned contractor can use this chat'
        }), 403

    messages = Message.query.filter_by(project_id=project_id).order_by(Message.created_at.asc()).all()
    return jsonify({
        'messages': [m.to_dict() for m in messages],
        'project_id': project_id
    }), 200


@chat_bp.route('/<int:project_id>', methods=['POST'])
@jwt_required()
def send_message(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status not in CHAT_AVAILABLE_STATUSES:
        return jsonify({
            'error': f'Chat is not available for project status {project.status}'
        }), 403
    if not _is_project_participant(project, user_id):
        return jsonify({
            'error': 'Access denied: only customer or assigned contractor can use this chat'
        }), 403

    data = request.get_json(silent=True) or {}
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'Content is required'}), 400

    message = Message(
        project_id=project_id,
        sender_id=user_id,
        content=content
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': message.to_dict()}), 201
