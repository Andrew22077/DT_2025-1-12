from django.core.management.base import BaseCommand
from django.utils import timezone
from competencias.models import PeriodoAcademico


class Command(BaseCommand):
    help = 'Crea el período académico actual basado en la fecha del sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--año',
            type=int,
            help='Año específico para el período (por defecto: año actual)'
        )
        parser.add_argument(
            '--semestre',
            type=int,
            choices=[1, 2],
            help='Semestre específico (por defecto: determinado por el mes)'
        )
        parser.add_argument(
            '--forzar',
            action='store_true',
            help='Forzar la creación incluso si ya existe un período para esa fecha'
        )

    def handle(self, *args, **options):
        fecha_actual = timezone.now().date()
        
        # Determinar año y semestre
        año = options.get('año') or fecha_actual.year
        mes_actual = fecha_actual.month
        
        # Determinar semestre basado en el mes si no se especifica
        if options.get('semestre'):
            semestre = options['semestre']
        else:
            semestre = 1 if mes_actual <= 6 else 2
        
        # Verificar si ya existe un período para esta combinación
        periodo_existente = PeriodoAcademico.objects.filter(
            año=año,
            semestre=semestre
        ).first()
        
        if periodo_existente and not options.get('forzar'):
            self.stdout.write(
                self.style.WARNING(
                    f'Ya existe un período para {año}-{semestre}: {periodo_existente.codigo} - {periodo_existente.nombre}'
                )
            )
            return
        
        # Determinar fechas del período
        if semestre == 1:
            fecha_inicio = fecha_actual.replace(month=1, day=1)
            fecha_fin = fecha_actual.replace(month=6, day=30)
            nombre = f"Primer Semestre {año}"
        else:
            fecha_inicio = fecha_actual.replace(month=7, day=1)
            fecha_fin = fecha_actual.replace(month=12, day=31)
            nombre = f"Segundo Semestre {año}"
        
        # Crear o actualizar el período
        if periodo_existente and options.get('forzar'):
            periodo_existente.fecha_inicio = fecha_inicio
            periodo_existente.fecha_fin = fecha_fin
            periodo_existente.nombre = nombre
            periodo_existente.activo = True
            periodo_existente.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Período actualizado: {periodo_existente.codigo} - {periodo_existente.nombre}'
                )
            )
        else:
            # Desactivar otros períodos si este es el actual
            if fecha_inicio <= fecha_actual <= fecha_fin:
                PeriodoAcademico.objects.filter(activo=True).update(activo=False)
                activo = True
            else:
                activo = False
            
            nuevo_periodo = PeriodoAcademico.objects.create(
                año=año,
                semestre=semestre,
                nombre=nombre,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                activo=activo
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Período creado: {nuevo_periodo.codigo} - {nuevo_periodo.nombre}'
                )
            )
            
            if activo:
                self.stdout.write(
                    self.style.SUCCESS('Este período ha sido marcado como activo.')
                )
        
        # Mostrar resumen de períodos
        self.stdout.write('\nPeríodos académicos existentes:')
        periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
        
        for periodo in periodos:
            estado = "ACTIVO" if periodo.activo else "Inactivo"
            self.stdout.write(
                f'  {periodo.codigo} - {periodo.nombre} ({estado})'
            )
