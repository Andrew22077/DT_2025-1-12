from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Profesor, Estudiante

@admin.register(Profesor)
class ProfesorAdmin(UserAdmin):
    list_display = ('nombre', 'cedula', 'correo', 'is_active', 'is_staff', 'foto_preview')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('nombre', 'cedula', 'correo')
    ordering = ('nombre',)
    
    # Solo incluir campos que existen en el modelo
    fieldsets = (
        (None, {'fields': ('cedula', 'nombre', 'correo', 'password')}),
        ('Foto de Perfil', {'fields': ('foto',)}),
        ('Permisos', {'fields': ('is_active', 'is_staff')}),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('cedula', 'nombre', 'correo', 'password1', 'password2'),
        }),
    )
    
    # No incluir filter_horizontal ya que no tenemos groups ni user_permissions
    filter_horizontal = ()
    
    def foto_preview(self, obj):
        """Mostrar vista previa de la foto"""
        if obj.foto:
            return f'<img src="{obj.foto.url}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />'
        return 'Sin foto'
    
    foto_preview.short_description = 'Foto'
    foto_preview.allow_tags = True

@admin.register(Estudiante)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'documento', 'grupo', 'estado', 'correo')
    list_filter = ('estado', 'grupo')
    search_fields = ('nombre', 'documento', 'correo')
    ordering = ('grupo', 'nombre')
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('documento', 'nombre', 'correo')
        }),
        ('Información Académica', {
            'fields': ('grupo', 'estado')
        }),
    )
    
    readonly_fields = ('documento', 'nombre', 'correo', 'grupo', 'estado')
