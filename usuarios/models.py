from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class ProfesorManager(BaseUserManager):
    def create_user(self, correo, nombre, cedula, contrasenia=None):
        if not correo:
            raise ValueError('El usuario debe tener un correo electrónico')
        correo = self.normalize_email(correo)
        profesor = self.model(correo=correo, nombre=nombre, cedula=cedula)
        profesor.set_password(contrasenia)
        profesor.save(using=self._db)
        return profesor

    def create_superuser(self, *args, **kwargs):
        raise NotImplementedError("No se permite crear superusuarios en este modelo")

class Profesor(AbstractBaseUser):
    cedula = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = ProfesorManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'cedula']

    def __str__(self):
        return f"{self.nombre} ({self.cedula})"
