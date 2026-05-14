from flask_jwt_extended import decode_token
from flask import request
from flask_socketio import emit, disconnect, join_room
from models import db, Message, Project

CHAT_AVAILABLE_STATUSES = ('PENDING_FUNDS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DISPUTED')


def register_socket_events(socketio):
    sid_to_user_id = {}

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

    def _extract_token():
        auth_payload = request.args.get('token')
        if auth_payload:
            return auth_payload

        auth = getattr(request, 'auth', None)
        if isinstance(auth, dict):
            token = auth.get('token')
            if isinstance(token, str) and token.strip():
                return token.strip()
        return None

    def get_socket_user_id():
        user_id = sid_to_user_id.get(request.sid)
        if user_id:
            return int(user_id)

        token = _extract_token()
        if not token:
            return None
        try:
            decoded = decode_token(token)
            user_id = int(decoded['sub'])
            sid_to_user_id[request.sid] = user_id
            return user_id
        except Exception:
            return None
    
    @socketio.on('connect')
    def handle_connect():
        token = _extract_token()
        if not token:
            disconnect()
            return False
        try:
            decoded = decode_token(token)
            user_id = int(decoded['sub'])
            sid_to_user_id[request.sid] = user_id
            emit('connected', {'status': 'ok', 'user_id': user_id})
        except Exception:
            disconnect()
            return False
    
    @socketio.on('disconnect')
    def handle_disconnect():
        sid_to_user_id.pop(request.sid, None)
    
    @socketio.on('join_project')
    def handle_join_project(data):
        user_id = get_socket_user_id()
        if not user_id:
            emit('error', {'message': 'Not authenticated'})
            return
        
        project_id = data.get('project_id') if isinstance(data, dict) else None
        try:
            project_id = int(project_id)
        except (TypeError, ValueError):
            project_id = None
        if not project_id:
            emit('error', {'message': 'project_id is required'})
            return
        
        project = Project.query.get(project_id)
        if not project:
            emit('error', {'message': 'Project not found'})
            return
        
        if not _is_project_participant(project, user_id):
            emit('error', {'message': 'Access denied: only customer or assigned contractor can use this chat'})
            return
        
        if project.status not in CHAT_AVAILABLE_STATUSES:
            emit('error', {'message': f'Chat not available for project status {project.status}'})
            return
        
        room = f'project_{project_id}'
        join_room(room)
        emit('joined', {'status': 'joined', 'room': room, 'project_id': project_id})
    
    @socketio.on('send_message')
    def handle_send_message(data):
        user_id = get_socket_user_id()
        if not user_id:
            emit('error', {'message': 'Not authenticated'})
            return
        
        project_id = data.get('project_id') if isinstance(data, dict) else None
        content = data.get('content', '') if isinstance(data, dict) else ''
        try:
            project_id = int(project_id)
        except (TypeError, ValueError):
            project_id = None
        content = content.strip() if isinstance(content, str) else ''
        
        if not project_id:
            emit('error', {'message': 'project_id is required'})
            return
        
        if not content:
            emit('error', {'message': 'Message content cannot be empty'})
            return
        
        project = Project.query.get(project_id)
        if not project:
            emit('error', {'message': 'Project not found'})
            return
        
        if not _is_project_participant(project, user_id):
            emit('error', {'message': 'Access denied: only customer or assigned contractor can use this chat'})
            return
        
        if project.status not in CHAT_AVAILABLE_STATUSES:
            emit('error', {'message': f'Chat not available for project status {project.status}'})
            return
        
        message = Message(
            project_id=project_id,
            sender_id=user_id,
            content=content
        )
        db.session.add(message)
        db.session.commit()
        
        msg_data = message.to_dict()
        room = f'project_{project_id}'
        socketio.emit('new_message', msg_data, room=room)
