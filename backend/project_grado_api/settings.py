import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ⚠️ Cambia esto en producción
SECRET_KEY = 'django-insecure-_k0!#z7w=9cct0*9m(i9vi*!)gws==$$%-9!37ypjfpi&$q77p'

# ✅ True en desarrollo, False en producción
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '3.17.149.166']

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
    'corsheaders.middleware.CorsMiddleware',  # 👈 debe ir arriba
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'midb',
        'USER': 'competenciasGAC',
        'PASSWORD': 'Unbosqu32025',
        'HOST': '127.0.0.1',  # ⚠️ usa 127.0.0.1, no "localhost"
        'PORT': '3306',
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

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ======================
#  CORS
# ======================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # desarrollo
    "http://3.17.149.166",    # producción
]

# Para desarrollo puedes habilitar todo (⚠️ no en producción)
# CORS_ALLOW_ALL_ORIGINS = True
