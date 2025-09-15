from rest_framework import serializers
from .models import Profesor
from .models import Estudiante
from competencias.models import Materia

# Serializer para mostrar materias con detalle
class MateriaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'nombre', 'descripcion']

# Serializer para registro y login
class ProfesorSerializer(serializers.ModelSerializer):
    contrasenia = serializers.CharField(write_only=True)
    materias = serializers.PrimaryKeyRelatedField(
        queryset=Materia.objects.all(), 
        many=True, 
        required=False
    )

    class Meta:
        model = Profesor
        fields = ['id', 'cedula', 'nombre', 'correo', 'contrasenia', 'is_active', 'is_staff', 'materias']

    def create(self, validated_data):
        materias_data = validated_data.pop('materias', [])
        contrasenia = validated_data.pop('contrasenia')
        profesor = Profesor.objects.create_user(**validated_data, contrasenia=contrasenia)
        profesor.materias.set(materias_data)
        return profesor

# Serializer para mostrar datos en tabla
class ProfesorTablaSerializer(serializers.ModelSerializer):
    materias = MateriaDetalleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profesor
        fields = ['id', 'last_login', 'cedula', 'nombre', 'correo', 'is_active', 'is_staff', 'materias']
        read_only_fields = fields

# Serializer para perfil completo (incluye foto)
class ProfesorPerfilSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()
    materias = serializers.SerializerMethodField()
    
    class Meta:
        model = Profesor
        fields = ['id', 'cedula', 'nombre', 'correo', 'foto', 'foto_url', 'is_active', 'is_staff', 'materias']
        read_only_fields = ['id', 'is_active', 'is_staff']
    
    def get_foto_url(self, obj):
        """Obtener URL de la foto o imagen por defecto"""
        if obj.foto and hasattr(obj.foto, 'url'):
            # Usar la URL completa del archivo
            return obj.foto.url
        return '/static/default-avatar.png'  # Imagen por defecto
    
    def get_materias(self, obj):
        """Obtener las materias del profesor con sus nombres"""
        materias = obj.materias.all()
        return [{'id': materia.id, 'nombre': materia.nombre} for materia in materias]
    
    def update(self, instance, validated_data):
        """Actualizar profesor con validación de foto"""
        # Extraer materias de los datos originales antes de la validación
        materias_data = None
        if hasattr(self, 'initial_data') and 'materias' in self.initial_data:
            materias_data = self.initial_data['materias']
            print(f"Datos iniciales de materias: {materias_data}")
            print(f"Tipo de materias_data: {type(materias_data)}")
        
        # Si se está actualizando la foto, eliminar la anterior
        if 'foto' in validated_data and instance.foto:
            if instance.foto:
                instance.foto.delete(save=False)
        
        try:
            # Actualizar el profesor
            profesor = super().update(instance, validated_data)
            
            # Actualizar materias si se proporcionaron
            if materias_data is not None:
                # Convertir a lista de IDs si es necesario
                if isinstance(materias_data, list):
                    # Filtrar valores None, vacíos, o inválidos y convertir a enteros
                    materias_ids = []
                    for m in materias_data:
                        if m is not None and m != '' and str(m) != 'None':
                            try:
                                # Si es un objeto Materia, obtener su ID
                                if hasattr(m, 'id'):
                                    materia_id = m.id
                                else:
                                    materia_id = int(m)
                                
                                if materia_id > 0:  # Asegurar que sea un ID válido
                                    materias_ids.append(materia_id)
                            except (ValueError, TypeError):
                                continue
                    
                    # Verificar que las materias existen
                    materias_existentes = Materia.objects.filter(id__in=materias_ids)
                    profesor.materias.set(materias_existentes)
                else:
                    profesor.materias.set(materias_data)
            
            return profesor
        except Exception as e:
            print(f"Error en serializer update: {e}")
            raise e

# Serializer para actualización de foto únicamente
class ProfesorFotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profesor
        fields = ['foto']
    
    def update(self, instance, validated_data):
        """Actualizar solo la foto del profesor"""
        # Eliminar foto anterior si existe
        if instance.foto:
            instance.foto.delete(save=False)
        
        # Asignar nueva foto
        instance.foto = validated_data.get('foto', instance.foto)
        instance.save()
        return instance

class EstudianteSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    class Meta:
        model = Estudiante
        fields = [
            'id', 'documento', 'nombre', 'correo', 'grupo', 
            'estado', 'estado_display'
        ]
        read_only_fields = ['id', 'estado_display']

    def validate_documento(self, value):
        """Validar formato del documento"""
        # Limpiar el documento (solo números)
        documento_limpio = ''.join(filter(str.isdigit, str(value)))
        
        if len(documento_limpio) < 6:
            raise serializers.ValidationError("El documento debe tener al menos 6 dígitos")
        
        if len(documento_limpio) > 20:
            raise serializers.ValidationError("El documento no puede tener más de 20 dígitos")
            
        return documento_limpio

    def validate_correo(self, value):
        """Validar formato del correo"""
        if value:
            return value.lower().strip()
        return value

    def validate_grupo(self, value):
        """Validar y normalizar grupo"""
        if value:
            return value.strip().upper()
        return value

    def validate_estado(self, value):
        """Validar que el estado sea válido"""
        estados_validos = [choice[0] for choice in Estudiante.ESTADO_CHOICES]
        if value not in estados_validos:
            raise serializers.ValidationError(f"Estado inválido. Opciones válidas: {estados_validos}")
        return value

    def validate(self, attrs):
        """Validaciones a nivel de objeto"""
        # Verificar que el documento no esté duplicado (excluyendo el objeto actual en actualizaciones)
        documento = attrs.get('documento')
        if documento:
            queryset = Estudiante.objects.filter(documento=documento)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'documento': f'Ya existe un estudiante con el documento {documento}'
                })
        
        return attrs

    def create(self, validated_data):
        """Crear un nuevo estudiante"""
        return Estudiante.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """Actualizar un estudiante existente"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance