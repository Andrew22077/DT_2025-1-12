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
    path('api/racs/aleatorios-por-gac/', views.obtener_racs_aleatorios_por_gac, name='obtener_racs_aleatorios_por_gac'),
    path('api/evaluaciones/estudiante/<int:estudiante_id>/', views.obtener_evaluaciones_estudiante, name='obtener_evaluaciones_estudiante'),
    path('api/evaluaciones/crear/', views.crear_o_actualizar_evaluacion, name='crear_o_actualizar_evaluacion'),
    path('api/evaluaciones/masivas/', views.crear_evaluaciones_masivas, name='crear_evaluaciones_masivas'),
    path('api/evaluaciones/estadisticas/', views.estadisticas_evaluaciones, name='estadisticas_evaluaciones'),
    path('api/evaluaciones/estadisticas-por-gac/', views.estadisticas_por_gac, name='estadisticas_por_gac'),
    path('api/evaluaciones/resultados-estudiante/<int:estudiante_id>/', views.resultados_estudiante, name='resultados_estudiante'),
    path('api/evaluaciones/resultados-globales/', views.resultados_globales, name='resultados_globales'),
    
    # Nuevas APIs para informes
    path('api/informes/gac-semestre/', views.informes_por_gac_semestre, name='informes_por_gac_semestre'),
    path('api/informes/profesor-materia/', views.informes_por_profesor_materia, name='informes_por_profesor_materia'),
    path('api/informes/estudiante-profesores/', views.informes_por_estudiante_profesores, name='informes_por_estudiante_profesores'),
    path('api/informes/detalle-profesor-materia/<int:profesor_id>/<int:materia_id>/', views.informes_detalle_profesor_materia, name='informes_detalle_profesor_materia'),
    path('api/debug-datos/', views.debug_datos, name='debug_datos'),
    path('api/materias/', views.obtener_todas_materias, name='obtener_todas_materias'),
    path('api/materias-profesor/', views.obtener_materias_profesor, name='obtener_materias_profesor'),
    path('api/gacs-por-materia/<int:materia_id>/', views.obtener_gacs_por_materia, name='obtener_gacs_por_materia'),
    
    # URLs para descarga de PDFs
    path('api/pdf/resumen-general/', views.descargar_pdf_resumen_general, name='descargar_pdf_resumen_general'),
    path('api/pdf/por-gac/', views.descargar_pdf_por_gac, name='descargar_pdf_por_gac'),
    path('api/pdf/por-profesor/', views.descargar_pdf_por_profesor, name='descargar_pdf_por_profesor'),
    path('api/pdf/por-estudiante/', views.descargar_pdf_por_estudiante, name='descargar_pdf_por_estudiante'),

    # Router URLs después (más generales)
    path('api/', include(router.urls)),
]
