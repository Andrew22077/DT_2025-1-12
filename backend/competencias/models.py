from django.db import models

# Create your models here.
from django.db import models
from usuarios.models import Profesor, Estudiante  # Importas los que ya tienes

# -----------------------
# GAC
# -----------------------
class GAC(models.Model):
    descripcion = models.TextField()
    numero = models.IntegerField(unique=True)

    def __str__(self):
        return f"GAC {self.numero}: {self.descripcion[:50]}"


# -----------------------
# RAC
# -----------------------
class RAC(models.Model):
    descripcion = models.TextField()
    numero = models.IntegerField(unique=True)
    gacs = models.ManyToManyField("GAC", related_name="racs")

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

    def __str__(self):
        return self.nombre

# -----------------------
# Evaluación
# -----------------------
class Evaluacion(models.Model):
    rac = models.ForeignKey(RAC, on_delete=models.CASCADE, related_name="evaluaciones")
    estudiante = models.ForeignKey(
        Estudiante, on_delete=models.CASCADE, related_name="evaluaciones"
    )
    profesor = models.ForeignKey(
        Profesor, on_delete=models.CASCADE, related_name="evaluaciones"
    )
    puntaje = models.DecimalField(max_digits=5, decimal_places=2)

    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Eval {self.estudiante.nombre} - {self.rac.numero} ({self.puntaje})"
