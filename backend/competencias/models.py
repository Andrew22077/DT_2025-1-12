from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# Create your models here.
from django.db import models
from usuarios.models import Profesor, Estudiante  # Importas los que ya tienes

# -----------------------
# GAC
# -----------------------
class GAC(models.Model):
    descripcion = models.TextField()
    numero = models.IntegerField(unique=True)

    class Meta:
        verbose_name = "GAC"
        verbose_name_plural = "GACs"
        ordering = ['numero']

    def __str__(self):
        return f"GAC {self.numero}: {self.descripcion[:50]}"


# -----------------------
# RAC
# -----------------------
class RAC(models.Model):
    descripcion = models.TextField()
    numero = models.IntegerField(unique=True)
    gacs = models.ManyToManyField("GAC", related_name="racs")

    class Meta:
        verbose_name = "RAC"
        verbose_name_plural = "RACs"
        ordering = ['numero']

    def __str__(self):
        return f"RAC {self.numero}: {self.descripcion[:50]}"


# -----------------------
# Materia
# -----------------------
class Materia(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    profesores = models.ManyToManyField(
        "usuarios.Profesor", related_name="materias"
    )
    racs = models.ManyToManyField("RAC", related_name="materias")

    class Meta:
        verbose_name = "Materia"
        verbose_name_plural = "Materias"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

# -----------------------
# Evaluación
# -----------------------
class Evaluacion(models.Model):
    rac = models.ForeignKey(
        RAC, 
        on_delete=models.CASCADE, 
        related_name="evaluaciones",
        verbose_name="RAC evaluado"
    )
    estudiante = models.ForeignKey(
        Estudiante, 
        on_delete=models.CASCADE, 
        related_name="evaluaciones",
        verbose_name="Estudiante evaluado"
    )
    profesor = models.ForeignKey(
        Profesor, 
        on_delete=models.CASCADE, 
        related_name="evaluaciones",
        verbose_name="Profesor evaluador"
    )
    puntaje = models.FloatField(
        choices=[
            (0.0, '0 - Reprobado'),
            (1.0, '1 - Deficiente'),
            (2.0, '2 - Deficiente'),
            (3.0, '3 - Insuficiente'),
            (3.5, '3.5 - Aprobado'),
            (4.0, '4 - Notable'),
            (5.0, '5 - Excelente')
        ],
        verbose_name="Puntaje de evaluación"
    )
    fecha = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de evaluación")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    class Meta:
        verbose_name = "Evaluación"
        verbose_name_plural = "Evaluaciones"
        ordering = ['-fecha']
        # Índice compuesto para búsquedas eficientes
        indexes = [
            models.Index(fields=['estudiante', 'rac']),
            models.Index(fields=['profesor', 'estudiante']),
            models.Index(fields=['fecha']),
        ]
        # Restricción única: un profesor solo puede evaluar un estudiante en un RAC específico
        unique_together = ['estudiante', 'rac', 'profesor']

    def __str__(self):
        return f"Eval {self.estudiante.nombre} - RAC {self.rac.numero} ({self.puntaje}) - {self.profesor.nombre}"

    def clean(self):
        """Validaciones personalizadas del modelo"""
        super().clean()
        
        # Validar que el estudiante esté matriculado
        if self.estudiante and self.estudiante.estado != 'matriculado':
            raise ValidationError({
                'estudiante': 'Solo se pueden evaluar estudiantes matriculados'
            })
        
        # Validar que el puntaje esté en el rango correcto (0-5) y sea un valor válido
        if self.puntaje is not None:
            valid_puntajes = [0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 5.0]
            if self.puntaje not in valid_puntajes:
                raise ValidationError({
                    'puntaje': 'El puntaje debe ser uno de los valores válidos: 0, 1, 2, 3, 3.5, 4, 5'
                })

    def save(self, *args, **kwargs):
        """Override save para aplicar validaciones"""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def puntaje_formateado(self):
        """Retorna el puntaje formateado como string"""
        return f"{self.puntaje}"

    @property
    def es_aprobado(self):
        """Determina si la evaluación está aprobada (puntaje >= 3)"""
        return self.puntaje >= 3
