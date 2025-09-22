from django.core.management.base import BaseCommand
from competencias.models import Materia

class Command(BaseCommand):
    help = 'Verificar materias en la base de datos'

    def handle(self, *args, **options):
        materias = Materia.objects.all()
        
        self.stdout.write(f'Total de materias: {materias.count()}')
        
        for materia in materias:
            self.stdout.write(f'ID: {materia.id} - Nombre: {materia.nombre}')
        
        if materias.count() == 0:
            self.stdout.write(self.style.WARNING('No hay materias en la base de datos'))
            self.stdout.write('Creando materias de ejemplo...')
            
            # Crear algunas materias de ejemplo
            materias_ejemplo = [
                {'nombre': 'Gestión de Proyectos I', 'descripcion': 'Fundamentos de gestión de proyectos'},
                {'nombre': 'Gestión de Proyectos II', 'descripcion': 'Planificación y ejecución de proyectos'},
                {'nombre': 'Liderazgo en Proyectos', 'descripcion': 'Habilidades de liderazgo y trabajo en equipo'},
                {'nombre': 'Herramientas de Gestión', 'descripcion': 'Herramientas tecnológicas para gestión de proyectos'},
                {'nombre': 'Seminario de Investigación', 'descripcion': 'Metodología de investigación en proyectos'},
            ]
            
            for materia_data in materias_ejemplo:
                materia, created = Materia.objects.get_or_create(
                    nombre=materia_data['nombre'],
                    defaults={'descripcion': materia_data['descripcion']}
                )
                if created:
                    self.stdout.write(f'Materia creada: {materia.nombre}')
                else:
                    self.stdout.write(f'Materia ya existe: {materia.nombre}')

