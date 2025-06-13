"""
URL configuration for proyectoapi project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from usuarios import views
urlpatterns = [
    path('admin/', admin.site.urls),  # Ruta para el admin
    re_path('login', views.login_view),  # Ruta para el login
    re_path('register', views.register),  # Ruta para el registro
    re_path('logout', views.logout),  # Ruta para logout
    re_path('listar-profesores', views.listar_profesores),  # Ruta para listar los profesores
    re_path('profesor/(?P<id>[0-9]+)', views.profesor_detail),  # Ruta para editar un profesor por ID
    re_path(r'^api/profesores/(?P<id>[0-9]+)/update/$', views.update_profesor_status, name='update_profesor_status'),
    re_path('import-excel-profesores', views.import_excel_profesores, name='import_excel_profesores'),
    re_path(r'^perfil/actualizar/$', views.actualizar_perfil_usuario),
    #re_path('export-excel-profesores/', views.export_excel_profesores, name='export_excel_profesores'),
    re_path('listar-estudiantes', views.listar_estudiantes),
    re_path(r'api/estudiante/(?P<id>[0-9]+)', views.estudiante_detail, name='estudiante_detail'),
    re_path(r'api/register-estudiante', views.register_estudiante, name='register_estudiante'),
    re_path(r'api/estudiantes-por-grupo/(?P<grupo>[\w-]+)', views.estudiantes_por_grupo, name='estudiantes_por_grupo'),
    re_path(r'api/grupos', views.get_grupos, name='get_grupos'),
    re_path(r'api/import-excel-estudiantes', views.import_excel_estudiantes, name='import_excel_estudiantes'),
    re_path(r'api/export-excel-estudiantes', views.export_excel_estudiantes, name='export_excel_estudiantes'),
]