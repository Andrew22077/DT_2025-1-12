from rest_framework import serializers
from .models import Profesor

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
