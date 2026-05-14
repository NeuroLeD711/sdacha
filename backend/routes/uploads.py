import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Project

uploads_bp = Blueprint('uploads', __name__, url_prefix='/api/uploads')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'rar', 'doc', 'docx', 'txt', 'py', 'js', 'html', 'css', 'json', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.route('', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    project_id = request.form.get('project_id')
    
    if project_id:
        try:
            project_id = int(project_id)
        except (TypeError, ValueError):
            return jsonify({'error': 'project_id must be a valid integer'}), 400

        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if project.customer_id != user_id and project.contractor_id != user_id:
            return jsonify({'error': 'Access denied to this project'}), 403
    
    user_folder = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), str(user_id))
    os.makedirs(user_folder, exist_ok=True)
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    
    if project_id:
        project_folder = os.path.join(user_folder, str(project_id))
        os.makedirs(project_folder, exist_ok=True)
        filepath = os.path.join(project_folder, filename)
    else:
        filepath = os.path.join(user_folder, filename)
    
    file.save(filepath)
    
    file_size = os.path.getsize(filepath)
    
    file_url = f"/api/uploads/{user_id}/{filename}"
    if project_id:
        file_url = f"/api/uploads/{user_id}/{project_id}/{filename}"
    
    return jsonify({
        'filename': filename,
        'original_name': file.filename,
        'url': file_url,
        'size': file_size,
        'type': ext
    }), 200


@uploads_bp.route('/<path:filepath>', methods=['GET'])
@jwt_required()
def get_file(filepath):
    from flask import send_from_directory
    user_id = int(get_jwt_identity())
    parts = filepath.split('/')
    if len(parts) < 2:
        return jsonify({'error': 'Invalid path'}), 400

    owner_id = parts[0]
    try:
        owner_id_int = int(owner_id)
    except ValueError:
        return jsonify({'error': 'Invalid file owner id'}), 400

    # /api/uploads/<owner_id>/<project_id>/<filename>
    if len(parts) >= 3:
        try:
            project_id = int(parts[1])
        except ValueError:
            return jsonify({'error': 'Invalid project id'}), 400

        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        if user_id not in (project.customer_id, project.contractor_id):
            return jsonify({'error': 'Access denied'}), 403
        filename = '/'.join(parts[1:])
    else:
        # /api/uploads/<owner_id>/<filename> is only available to the file owner.
        if user_id != owner_id_int:
            return jsonify({'error': 'Access denied'}), 403
        filename = '/'.join(parts[1:])

    folder = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), owner_id)
    try:
        return send_from_directory(folder, filename)
    except Exception:
        return jsonify({'error': 'File not found'}), 404
