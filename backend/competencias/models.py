from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# Create your models here.
from django.db import models
from usuarios.models import Profesor, Estudiante  # Importas los que ya tienes

# -----------------------
# Período Académico
# -----------------------
class PeriodoAcademico(models.Model):
    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código del período")
    nombre = models.CharField(max_length=50, verbose_name="Nombre del período")
    año = models.IntegerField(verbose_name="Año")
    semestre = models.IntegerField(
        choices=[(1, 'Primer Semestre'), (2, 'Segundo Semestre')],
        verbose_name="Semestre"
    )
    fecha_inicio = models.DateField(verbose_name="Fecha de inicio")
    fecha_fin = models.DateField(verbose_name="Fecha de fin")
    activo = models.BooleanField(default=True, verbose_name="Período activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")

    class Meta:
        verbose_name = "Período Académico"
        verbose_name_plural = "Períodos Académicos"
        ordering = ['-año', '-semestre']
        unique_together = ['año', 'semestre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def clean(self):
        """Validaciones personalizadas del modelo"""
        super().clean()
        
        # Validar que la fecha de fin sea posterior a la fecha de inicio
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin <= self.fecha_inicio:
            raise ValidationError({
                'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
        
        # Generar código automáticamente si no se proporciona
        if not self.codigo and self.año and self.semestre:
            self.codigo = f"{self.año}-{self.semestre}"

    def save(self, *args, **kwargs):
        """Override save para aplicar validaciones y generar código"""
        # Generar código automáticamente si no se proporciona
        if not self.codigo and self.año and self.semestre:
            self.codigo = f"{self.año}-{self.semestre}"
        
        # Generar nombre automáticamente si no se proporciona
        if not self.nombre and self.año and self.semestre:
            semestre_nombre = "Primer Semestre" if self.semestre == 1 else "Segundo Semestre"
            self.nombre = f"{semestre_nombre} {self.año}"
        
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_periodo_actual(cls):
        """Retorna el período académico actual basado en la fecha"""
        from django.utils import timezone
        
        fecha_actual = timezone.now().date()
        
        # Buscar período activo que contenga la fecha actual
        periodo_actual = cls.objects.filter(
            activo=True,
            fecha_inicio__lte=fecha_actual,
            fecha_fin__gte=fecha_actual
        ).first()
        
        if not periodo_actual:
            # Si no hay período activo, crear uno automáticamente
            año_actual = fecha_actual.year
            mes_actual = fecha_actual.month
            
            # Determinar semestre basado en el mes
            semestre = 1 if mes_actual <= 6 else 2
            
            periodo_actual = cls.objects.create(
                año=año_actual,
                semestre=semestre,
                fecha_inicio=fecha_actual,
                fecha_fin=fecha_actual.replace(month=12, day=31) if semestre == 2 
                         else fecha_actual.replace(month=6, day=30)
            )
        
        return periodo_actual

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
    periodo = models.ForeignKey(
        PeriodoAcademico,
        on_delete=models.CASCADE,
        related_name="evaluaciones",
        verbose_name="Período académico",
        default=None,
        null=True,
        blank=True
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
        # Restricción única: un profesor solo puede evaluar un estudiante en un RAC específico por período
        unique_together = ['estudiante', 'rac', 'profesor', 'periodo']

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
        """Override save para aplicar validaciones y asignar período automáticamente"""
        # Asignar período actual si no se proporciona
        if not self.periodo:
            self.periodo = PeriodoAcademico.get_periodo_actual()
        
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
