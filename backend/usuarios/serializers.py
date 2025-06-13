from rest_framework import serializers
from .models import Profesor
from .models import Estudiante

# Serializer para registro y login
class ProfesorSerializer(serializers.ModelSerializer):
    contrasenia = serializers.CharField(write_only=True)

    class Meta:
        model = Profesor
        fields = ['id', 'cedula', 'nombre', 'correo', 'contrasenia', 'is_active', 'is_staff']

    def create(self, validated_data):
        contrasenia = validated_data.pop('contrasenia')
        profesor = Profesor.objects.create_user(**validated_data, contrasenia=contrasenia)
        return profesor

# Serializer para mostrar datos en tabla
class ProfesorTablaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profesor
        fields = ['id', 'last_login', 'cedula', 'nombre', 'correo', 'is_active', 'is_staff']
        read_only_fields = fields

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