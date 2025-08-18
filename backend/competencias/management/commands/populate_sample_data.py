from django.core.management.base import BaseCommand
from competencias.models import GAC, RAC

class Command(BaseCommand):
    help = 'Pobla la base de datos con datos de ejemplo de GACs y RACs'

    def handle(self, *args, **options):
        self.stdout.write('Creando datos de ejemplo...')

        # Crear GACs de ejemplo
        gac1, created = GAC.objects.get_or_create(
            numero=1,
            defaults={'descripcion': 'GAC 1: Fundamentos de la gestión de proyectos'}
        )
        if created:
            self.stdout.write(f'GAC {gac1.numero} creado: {gac1.descripcion}')

        gac2, created = GAC.objects.get_or_create(
            numero=2,
            defaults={'descripcion': 'GAC 2: Planificación y ejecución de proyectos'}
        )
        if created:
            self.stdout.write(f'GAC {gac2.numero} creado: {gac2.descripcion}')

        gac3, created = GAC.objects.get_or_create(
            numero=3,
            defaults={'descripcion': 'GAC 3: Control y cierre de proyectos'}
        )
        if created:
            self.stdout.write(f'GAC {gac3.numero} creado: {gac3.descripcion}')

        # Crear RACs de ejemplo
        rac1, created = RAC.objects.get_or_create(
            numero=1,
            defaults={'descripcion': 'RAC 1: Comprender los conceptos fundamentales de la gestión de proyectos y su aplicación en diferentes contextos organizacionales.'}
        )
        if created:
            rac1.gacs.add(gac1)
            self.stdout.write(f'RAC {rac1.numero} creado: {rac1.descripcion}')

        rac2, created = RAC.objects.get_or_create(
            numero=2,
            defaults={'descripcion': 'RAC 2: Aplicar metodologías y herramientas de planificación para desarrollar cronogramas y presupuestos de proyectos.'}
        )
        if created:
            rac2.gacs.add(gac1, gac2)
            self.stdout.write(f'RAC {rac2.numero} creado: {rac2.descripcion}')

        rac3, created = RAC.objects.get_or_create(
            numero=3,
            defaults={'descripcion': 'RAC 3: Implementar estrategias de control y seguimiento para monitorear el progreso y desempeño de los proyectos.'}
        )
        if created:
            rac3.gacs.add(gac2, gac3)
            self.stdout.write(f'RAC {rac3.numero} creado: {rac3.descripcion}')

        rac4, created = RAC.objects.get_or_create(
            numero=4,
            defaults={'descripcion': 'RAC 4: Gestionar la comunicación y el trabajo en equipo para asegurar la colaboración efectiva en proyectos.'}
        )
        if created:
            rac4.gacs.add(gac1, gac2)
            self.stdout.write(f'RAC {rac4.numero} creado: {rac4.descripcion}')

        rac5, created = RAC.objects.get_or_create(
            numero=5,
            defaults={'descripcion': 'RAC 5: Evaluar y cerrar proyectos de manera efectiva, documentando lecciones aprendidas y mejores prácticas.'}
        )
        if created:
            rac5.gacs.add(gac3)
            self.stdout.write(f'RAC {rac5.numero} creado: {rac5.descripcion}')

        self.stdout.write(
            self.style.SUCCESS('Datos de ejemplo creados exitosamente!')
        )
        self.stdout.write(f'Total GACs: {GAC.objects.count()}')
        self.stdout.write(f'Total RACs: {RAC.objects.count()}')
