from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'gacs', views.GACViewSet)
router.register(r'racs', views.RACViewSet)
router.register(r'materias', views.MateriaViewSet)
router.register(r'evaluaciones', views.EvaluacionViewSet)

urlpatterns = [
    # URLs personalizadas primero (más específicas)
    path('api/estudiantes/', views.obtener_estudiantes, name='obtener_estudiantes'),
    path('api/racs/', views.obtener_racs, name='obtener_racs'),
    path('api/evaluaciones/estudiante/<int:estudiante_id>/', views.obtener_evaluaciones_estudiante, name='obtener_evaluaciones_estudiante'),
    path('api/evaluaciones/crear/', views.crear_o_actualizar_evaluacion, name='crear_o_actualizar_evaluacion'),
    path('api/evaluaciones/masivas/', views.crear_evaluaciones_masivas, name='crear_evaluaciones_masivas'),
    path('api/evaluaciones/estadisticas/', views.estadisticas_evaluaciones, name='estadisticas_evaluaciones'),
    
    # Router URLs después (más generales)
    path('api/', include(router.urls)),
]
