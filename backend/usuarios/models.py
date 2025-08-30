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
    foto = models.ImageField(upload_to='profesores_fotos/', null=True, blank=True, verbose_name="Foto del profesor")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = ProfesorManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'cedula']

    def __str__(self):
        return f"{self.nombre} ({self.cedula})"
    
    @property
    def foto_url(self):
        """Retorna la URL de la foto o una imagen por defecto"""
        if self.foto and hasattr(self.foto, 'url'):
            return self.foto.url
        return '/static/default-avatar.png'  # Imagen por defecto
    
# Agregar al final de tu models.py existente

class Estudiante(models.Model):
    # Opciones para el estado del estudiante
    ESTADO_CHOICES = [
        ('prematricula', 'Prematriculado'),
        ('matriculado', 'Matriculado'),
    ]
    
    documento = models.CharField(max_length=20, unique=True, verbose_name="Documento de identidad")
    nombre = models.CharField(max_length=100, verbose_name="Nombre completo")
    correo = models.EmailField(verbose_name="Correo electrónico")
    grupo = models.CharField(max_length=50, verbose_name="Grupo")
    estado = models.CharField(
        max_length=15, 
        choices=ESTADO_CHOICES, 
        default='prematricula',
        verbose_name="Estado de matrícula"
    )

    class Meta:
        verbose_name = "Estudiante"
        verbose_name_plural = "Estudiantes"
        ordering = ['grupo', 'nombre']
        db_table = 'estudiantes'  # Nombre específico para la tabla en MySQL

    def __str__(self):
        return f"{self.nombre} - {self.grupo} ({self.documento}) - {self.get_estado_display()}"

    def clean(self):
        """Validaciones personalizadas"""
        from django.core.exceptions import ValidationError
        
        # Limpiar y validar documento
        if self.documento:
            self.documento = ''.join(filter(str.isdigit, self.documento))
            if len(self.documento) < 6:
                raise ValidationError({'documento': 'El documento debe tener al menos 6 dígitos'})
        
        # Normalizar correo
        if self.correo:
            self.correo = self.correo.lower().strip()
        
        # Normalizar grupo
        if self.grupo:
            self.grupo = self.grupo.strip().upper()

    def save(self, *args, **kwargs):
        """Override save para aplicar validaciones"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def estado_display(self):
        """Propiedad para obtener el estado en formato legible"""
        return self.get_estado_display()
    
    @property
    def is_matriculado(self):
        """Verificar si el estudiante está matriculado"""
        return self.estado == 'matriculado'
    
    @property
    def is_prematriculado(self):
        """Verificar si el estudiante está prematriculado"""
        return self.estado == 'prematricula'