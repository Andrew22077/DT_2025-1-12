from rest_framework import serializers
from .models import GAC, RAC, Materia, Evaluacion, PeriodoAcademico
from usuarios.models import Profesor, Estudiante


class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = ['id', 'codigo', 'nombre', 'año', 'semestre', 'fecha_inicio', 'fecha_fin', 'activo']


class GACSerializer(serializers.ModelSerializer):
    class Meta:
        model = GAC
        fields = "__all__"

class RACSerializer(serializers.ModelSerializer):
    gacs = serializers.PrimaryKeyRelatedField(
        queryset=GAC.objects.all(), many=True
    )

    class Meta:
        model = RAC
        fields = ["id", "descripcion", "numero", "gacs"]



class MateriaSerializer(serializers.ModelSerializer):
    profesores = serializers.PrimaryKeyRelatedField(
        queryset=Profesor.objects.all(), many=True
    )
    racs = serializers.PrimaryKeyRelatedField(
        queryset=RAC.objects.all(), many=True
    )

    class Meta:
        model = Materia
        fields = ["id", "nombre", "descripcion", "profesores", "racs"]

class EvaluacionSerializer(serializers.ModelSerializer):
    estudiante = serializers.StringRelatedField(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(), source="estudiante", write_only=True
    )
    profesor = serializers.StringRelatedField(read_only=True)
    profesor_id = serializers.PrimaryKeyRelatedField(
        queryset=Profesor.objects.all(), source="profesor", write_only=True
    )
    rac = serializers.StringRelatedField(read_only=True)
    rac_id = serializers.PrimaryKeyRelatedField(
        queryset=RAC.objects.all(), source="rac", write_only=True
    )
    periodo = PeriodoAcademicoSerializer(read_only=True)
    periodo_id = serializers.PrimaryKeyRelatedField(
        queryset=PeriodoAcademico.objects.all(), source="periodo", write_only=True, required=False
    )

    class Meta:
        model = Evaluacion
        fields = [
            "id", "rac", "rac_id",
            "estudiante", "estudiante_id",
            "profesor", "profesor_id",
            "periodo", "periodo_id",
            "puntaje", "fecha"
        ]
        
class EstadisticaGACSerializer(serializers.Serializer):
    gac_numero = serializers.IntegerField()
    gac_descripcion = serializers.CharField()
    promedio = serializers.FloatField()
    total_evaluaciones = serializers.IntegerField()
    aprobadas = serializers.IntegerField()
    reprobadas = serializers.IntegerField()