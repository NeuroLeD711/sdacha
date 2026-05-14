from flask import Flask, send_from_directory
from config import Config
from extensions import db, jwt, socketio, cors, limiter
from routes.auth import auth_bp, limiter as auth_limiter
from routes.projects import projects_bp
from routes.chat import chat_bp
from routes.reviews import reviews_bp
from routes.admin import admin_bp
from routes.uploads import uploads_bp
from socket_events import register_socket_events
import threading
import time
import os
from datetime import datetime, timezone


def create_app():
    # Get absolute path to frontend dist
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'dist')
    app = Flask(__name__)
    # Don't use Flask's static - serve everything manually
    
    app.config.from_object(Config)
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

    limiter.init_app(app)
    auth_limiter.init_app(app)
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', '*')}})
    socketio_async_mode = app.config.get('SOCKETIO_ASYNC_MODE', 'threading')
    socketio_options = {
        'cors_allowed_origins': app.config.get('CORS_ORIGINS', '*'),
        'async_mode': socketio_async_mode
    }
    # Werkzeug + threading mode is stable with long-polling, but websocket upgrade
    # can trigger 500 errors in dev. Force polling-only transport in this mode.
    if socketio_async_mode == 'threading':
        socketio_options['allow_upgrades'] = False

    socketio.init_app(app, **socketio_options)

    @app.route('/')
    def serve_index():
        return send_from_directory(frontend_dist, 'index.html')

    @app.route('/<path:path>')
    def serve_spa(path):
        # API and socket.io go to API
        if path.startswith('api') or path.startswith('socket.io'):
            return {'error': 'Not found'}, 404
        # Try to serve static files first
        if path.startswith('assets/'):
            try:
                return send_from_directory(frontend_dist, path)
            except:
                pass
        # Everything else gets index.html for SPA
        return send_from_directory(frontend_dist, 'index.html')

    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(uploads_bp)

    register_socket_events(socketio)

    with app.app_context():
        db.create_all()

    def check_deadlines():
        from models import Project, EscrowAccount, User
        while True:
            time.sleep(60)
            with app.app_context():
                now = datetime.now(timezone.utc)
                overdue_projects = Project.query.filter(
                    Project.status.in_(['IN_PROGRESS', 'REVIEW']),
                    Project.deadline < now
                ).all()
                for project in overdue_projects:
                    project.status = 'DISPUTED'
                    db.session.commit()
                    socketio.emit('project_status_changed', {
                        'project_id': project.id,
                        'status': 'DISPUTED',
                        'reason': 'Deadline exceeded'
                    }, room=f'project_{project.id}')

    deadline_thread = threading.Thread(target=check_deadlines, daemon=True)
    deadline_thread.start()

    return app


if __name__ == '__main__':
    app = create_app()
    debug_mode = os.environ.get('FLASK_DEBUG', '1') == '1'
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=debug_mode,
        allow_unsafe_werkzeug=debug_mode
    )
