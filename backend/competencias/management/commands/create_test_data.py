from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from competencias.models import GAC, RAC, Materia, Evaluacion
from usuarios.models import Estudiante
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Crear datos de prueba para el sistema de evaluaciones'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos de prueba...')

        # Crear GACs
        gacs_data = [
            {'numero': 1, 'descripcion': 'GAC 1: Fundamentos de la gestión de proyectos'},
            {'numero': 2, 'descripcion': 'GAC 2: Planificación y ejecución de proyectos'},
            {'numero': 3, 'descripcion': 'GAC 3: Control y cierre de proyectos'},
        ]
        
        gacs = []
        for gac_data in gacs_data:
            gac, created = GAC.objects.get_or_create(
                numero=gac_data['numero'],
                defaults={'descripcion': gac_data['descripcion']}
            )
            gacs.append(gac)
            if created:
                self.stdout.write(f'GAC {gac.numero} creado: {gac.descripcion}')

        # Crear RACs
        racs_data = [
            {'numero': 1, 'descripcion': 'RAC 1: Comprender los conceptos fundamentales de la gestión de proyectos y su aplicación en diferentes contextos organizacionales.', 'gacs': [1]},
            {'numero': 2, 'descripcion': 'RAC 2: Aplicar metodologías y herramientas de planificación para desarrollar cronogramas y presupuestos de proyectos.', 'gacs': [1, 2]},
            {'numero': 3, 'descripcion': 'RAC 3: Implementar estrategias de control y seguimiento para monitorear el progreso y desempeño de los proyectos.', 'gacs': [2, 3]},
            {'numero': 4, 'descripcion': 'RAC 4: Gestionar la comunicación y el trabajo en equipo para asegurar la colaboración efectiva en proyectos.', 'gacs': [1, 2]},
            {'numero': 5, 'descripcion': 'RAC 5: Evaluar y cerrar proyectos de manera efectiva, documentando lecciones aprendidas y mejores prácticas.', 'gacs': [3]},
            {'numero': 6, 'descripcion': 'RAC 6: Identificar y gestionar riesgos en proyectos utilizando técnicas apropiadas de análisis y mitigación.', 'gacs': [2, 3]},
            {'numero': 7, 'descripcion': 'RAC 7: Liderar equipos de proyecto aplicando habilidades de liderazgo y motivación.', 'gacs': [1, 2]},
            {'numero': 8, 'descripcion': 'RAC 8: Utilizar herramientas tecnológicas para la gestión eficiente de proyectos.', 'gacs': [2, 3]},
            {'numero': 9, 'descripcion': 'RAC 9: Desarrollar y presentar informes de proyecto de manera clara y profesional.', 'gacs': [3]},
        ]
        
        racs = []
        for rac_data in racs_data:
            rac, created = RAC.objects.get_or_create(
                numero=rac_data['numero'],
                defaults={'descripcion': rac_data['descripcion']}
            )
            if created:
                # Asignar GACs al RAC
                for gac_numero in rac_data['gacs']:
                    gac = GAC.objects.get(numero=gac_numero)
                    rac.gacs.add(gac)
                racs.append(rac)
                self.stdout.write(f'RAC {rac.numero} creado: {rac.descripcion}')
            else:
                racs.append(rac)

        # Crear Materias
        materias_data = [
            {'nombre': 'Gestión de Proyectos I', 'descripcion': 'Fundamentos y planificación de proyectos'},
            {'nombre': 'Gestión de Proyectos II', 'descripcion': 'Ejecución y control de proyectos'},
            {'nombre': 'Liderazgo en Proyectos', 'descripcion': 'Habilidades de liderazgo y trabajo en equipo'},
        ]
        
        materias = []
        for materia_data in materias_data:
            materia, created = Materia.objects.get_or_create(
                nombre=materia_data['nombre'],
                defaults={'descripcion': materia_data['descripcion']}
            )
            if created:
                # Asignar RACs a la materia (todos los RACs para simplificar)
                materia.racs.set(racs)
                materias.append(materia)
                self.stdout.write(f'Materia {materia.nombre} creada')
            else:
                materias.append(materia)

        # Crear un profesor de prueba si no existe
        profesor, created = User.objects.get_or_create(
            username='profesor_test',
            defaults={
                'cedula': '12345678',
                'nombre': 'Profesor Test',
                'correo': 'profesor@test.com',
                'is_staff': True,
                'is_active': True
            }
        )
        if created:
            profesor.set_password('test123')
            profesor.save()
            # Asignar materias al profesor
            profesor.materias.set(materias)
            self.stdout.write('Profesor de prueba creado')
        else:
            # Asegurar que el profesor tenga materias asignadas
            profesor.materias.set(materias)

        # Crear estudiantes de prueba
        grupos = ['1A', '1B', '1C', '2A', '2B', '2C', 'Virtual 1']
        estudiantes_data = []
        
        for i in range(1, 16):  # 15 estudiantes
            grupo = random.choice(grupos)
            estudiantes_data.append({
                'documento': f'1000000{i:02d}',
                'nombre': f'Estudiante {i}',
                'grupo': grupo,
                'estado': 'activo'
            })

        estudiantes = []
        for estudiante_data in estudiantes_data:
            estudiante, created = Estudiante.objects.get_or_create(
                documento=estudiante_data['documento'],
                defaults=estudiante_data
            )
            if created:
                estudiantes.append(estudiante)
                self.stdout.write(f'Estudiante {estudiante.nombre} creado')
            else:
                estudiantes.append(estudiante)

        # Crear evaluaciones de prueba
        evaluaciones_creadas = 0
        for estudiante in estudiantes:
            for materia in materias:
                # Obtener RACs de la materia
                racs_materia = materia.racs.all()
                
                # Crear evaluaciones para algunos RACs (no todos para simular evaluación parcial)
                racs_a_evaluar = random.sample(list(racs_materia), min(6, len(racs_materia)))
                
                for rac in racs_a_evaluar:
                    # Crear evaluación solo si no existe
                    if not Evaluacion.objects.filter(
                        estudiante=estudiante,
                        profesor=profesor,
                        rac=rac
                    ).exists():
                        puntaje = random.randint(1, 5)
                        Evaluacion.objects.create(
                            estudiante=estudiante,
                            profesor=profesor,
                            rac=rac,
                            puntaje=puntaje
                        )
                        evaluaciones_creadas += 1

        self.stdout.write(
            self.style.SUCCESS(f'Datos de prueba creados exitosamente!')
        )
        self.stdout.write(f'Total GACs: {GAC.objects.count()}')
        self.stdout.write(f'Total RACs: {RAC.objects.count()}')
        self.stdout.write(f'Total Materias: {Materia.objects.count()}')
        self.stdout.write(f'Total Estudiantes: {Estudiante.objects.count()}')
        self.stdout.write(f'Total Evaluaciones: {Evaluacion.objects.count()}')
        self.stdout.write(f'Evaluaciones creadas en esta ejecución: {evaluaciones_creadas}')

