from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg, Count
from .models import GAC, RAC, Materia, Evaluacion

@admin.register(GAC)
class GACAdmin(admin.ModelAdmin):
    list_display = ['numero', 'descripcion_corta', 'total_racs']
    list_display_links = ['numero', 'descripcion_corta']
    search_fields = ['numero', 'descripcion']
    ordering = ['numero']
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + "..." if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = "Descripción"
    
    def total_racs(self, obj):
        return obj.racs.count()
    total_racs.short_description = "Total RACs"

@admin.register(RAC)
class RACAdmin(admin.ModelAdmin):
    list_display = ['numero', 'descripcion_corta', 'gacs_list', 'total_evaluaciones', 'promedio_puntaje']
    list_display_links = ['numero', 'descripcion_corta']
    list_filter = ['gacs']
    search_fields = ['numero', 'descripcion']
    ordering = ['numero']
    filter_horizontal = ['gacs']
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + "..." if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = "Descripción"
    
    def gacs_list(self, obj):
        return ", ".join([f"GAC {gac.numero}" for gac in obj.gacs.all()])
    gacs_list.short_description = "GACs asociados"
    
    def total_evaluaciones(self, obj):
        return obj.evaluaciones.count()
    total_evaluaciones.short_description = "Total evaluaciones"
    
    def promedio_puntaje(self, obj):
        avg = obj.evaluaciones.aggregate(Avg('puntaje'))['puntaje__avg']
        if avg:
            return f"{avg:.1f}"
        return "Sin evaluaciones"
    promedio_puntaje.short_description = "Promedio puntaje"

@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion_corta', 'total_profesores', 'total_racs']
    list_display_links = ['nombre', 'descripcion_corta']
    search_fields = ['nombre', 'descripcion']
    filter_horizontal = ['profesores', 'racs']
    
    def descripcion_corta(self, obj):
        return obj.descripcion[:100] + "..." if len(obj.descripcion) > 100 else obj.descripcion
    descripcion_corta.short_description = "Descripción"
    
    def total_profesores(self, obj):
        return obj.profesores.count()
    total_profesores.short_description = "Total profesores"
    
    def total_racs(self, obj):
        return obj.racs.count()
    total_racs.short_description = "Total RACs"

@admin.register(Evaluacion)
class EvaluacionAdmin(admin.ModelAdmin):
    list_display = [
        'estudiante_nombre', 'rac_numero', 'profesor_nombre', 
        'puntaje_coloreado', 'fecha', 'es_aprobado_coloreado'
    ]
    list_filter = [
        'rac', 'profesor', 'estudiante__grupo', 'fecha'
    ]
    search_fields = [
        'estudiante__nombre', 'estudiante__documento', 
        'profesor__nombre', 'rac__numero'
    ]
    readonly_fields = ['fecha', 'fecha_modificacion']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información de Evaluación', {
            'fields': ('estudiante', 'rac', 'profesor')
        }),
        ('Calificación', {
            'fields': ('puntaje',)
        }),
        ('Fechas', {
            'fields': ('fecha', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )
    
    def estudiante_nombre(self, obj):
        return f"{obj.estudiante.nombre} ({obj.estudiante.grupo})"
    estudiante_nombre.short_description = "Estudiante"
    estudiante_nombre.admin_order_field = 'estudiante__nombre'
    
    def rac_numero(self, obj):
        return f"RAC {obj.rac.numero}"
    rac_numero.short_description = "RAC"
    rac_numero.admin_order_field = 'rac__numero'
    
    def profesor_nombre(self, obj):
        return obj.profesor.nombre
    profesor_nombre.short_description = "Profesor"
    profesor_nombre.admin_order_field = 'profesor__nombre'
    
    def puntaje_coloreado(self, obj):
        color = 'green' if obj.puntaje >= 3.0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.puntaje_formateado
        )
    puntaje_coloreado.short_description = "Puntaje"
    puntaje_coloreado.admin_order_field = 'puntaje'
    
    def es_aprobado_coloreado(self, obj):
        if obj.es_aprobado:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ APROBADO</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ REPROBADO</span>'
            )
    es_aprobado_coloreado.short_description = "Estado"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'estudiante', 'profesor', 'rac'
        )
    
    def has_add_permission(self, request):
        # Solo permitir agregar desde la interfaz del sistema
        return False
    
    def has_change_permission(self, request, obj=None):
        # Solo permitir cambios desde la interfaz del sistema
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Solo permitir eliminación desde la interfaz del sistema
        return False

# Configuración del sitio admin
admin.site.site_header = "Administración del Sistema de Competencias"
admin.site.site_title = "Sistema de Competencias"
admin.site.index_title = "Panel de Control - Competencias"
