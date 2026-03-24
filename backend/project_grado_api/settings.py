import os
from pathlib import Path

from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent


def _env(key, default=None):
    """Lee variable de entorno o .env (para pruebas locales con Railway DB)"""
    return config(key, default=default)

# Producción: usa variables de entorno. Desarrollo: valores por defecto.
SECRET_KEY = _env('SECRET_KEY', 'django-insecure-_k0!#z7w=9cct0*9m(i9vi*!)gws==$$%-9!37ypjfpi&$q77p')
DEBUG = _env('DEBUG', 'True').lower() in ('1', 'true', 'yes')
_allowed = _env('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
if os.environ.get('RAILWAY_ENVIRONMENT'):  # Railway pone esto cuando está desplegado
    _allowed.extend(['.railway.app', '.up.railway.app'])
ALLOWED_HOSTS = [h.strip() for h in _allowed if h.strip()]

# ======================
#  APPS
# ======================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',

    # Apps propias
    'usuarios',
    'reportes',
    'competencias',
]

# ======================
#  MIDDLEWARE
# ======================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # Puedes crear esta carpeta si quieres usar templates personalizados
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ======================
#  URLS & WSGI
# ======================
ROOT_URLCONF = 'project_grado_api.urls'
WSGI_APPLICATION = 'project_grado_api.wsgi.application'
# Si usaras Channels:
# ASGI_APPLICATION = 'project_grado_api.asgi.application'

# ======================
#  BASE DE DATOS
# ======================
# Railway: usa MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
# Local: usa la configuración por defecto o .env para conectar a Railway
if _env('MYSQLHOST'):
    _db_options = {
        'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        'charset': 'utf8mb4',
    }
    if _env('MYSQL_SSL', '').lower() in ('1', 'true', 'yes'):
        _db_options['ssl'] = True
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': _env('MYSQLDATABASE', 'railway'),
            'USER': _env('MYSQLUSER', 'root'),
            'PASSWORD': _env('MYSQLPASSWORD', ''),
            'HOST': _env('MYSQLHOST'),
            'PORT': _env('MYSQLPORT', '3306'),
            'OPTIONS': _db_options,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': _env('DB_NAME', 'project_database'),
            'USER': _env('DB_USER', 'root'),
            'PASSWORD': _env('DB_PASSWORD', '0000'),
            'HOST': _env('DB_HOST', '127.0.0.1'),
            'PORT': _env('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"
            }
        }
    }

# ======================
#  AUTENTICACIÓN
# ======================
AUTH_USER_MODEL = 'usuarios.Profesor'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# ======================
#  INTERNACIONALIZACIÓN
# ======================
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# ======================
#  STATIC & MEDIA
# ======================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ======================
#  CORS
# ======================
_CORS_ORIGINS = _env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _CORS_ORIGINS.split(',') if o.strip()]
