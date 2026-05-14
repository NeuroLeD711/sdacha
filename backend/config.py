import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _parse_origins(value):
    return [origin.strip() for origin in value.split(',') if origin.strip()]


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "freelance_escrow.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production-2026')
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    JWT_REFRESH_TOKEN_EXPIRES = 2592000
    _base_origins = _parse_origins(os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000'))
    _dev_local_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
    ]
    _is_production = os.environ.get('APP_ENV') == 'production' or os.environ.get('FLASK_ENV') == 'production'
    CORS_ORIGINS = list(dict.fromkeys(_base_origins if _is_production else (_base_origins + _dev_local_origins)))
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    # Backward-compatible alias for older config usage.
    RATELIMIT_STORAGE_URL = RATELIMIT_STORAGE_URI
    SOCKETIO_ASYNC_MODE = os.environ.get('SOCKETIO_ASYNC_MODE', 'threading')
