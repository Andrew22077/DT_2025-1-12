from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import GAC, RAC, Materia, Evaluacion
from .serializers import GACSerializer, RACSerializer, MateriaSerializer, EvaluacionSerializer
from usuarios.models import Profesor, Estudiante
from django.db.models import Avg, Count
import random

# Create your views here.

class GACViewSet(viewsets.ModelViewSet):
    queryset = GAC.objects.all()
    serializer_class = GACSerializer

class RACViewSet(viewsets.ModelViewSet):
    queryset = RAC.objects.all()
    serializer_class = RACSerializer

class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer

class EvaluacionViewSet(viewsets.ModelViewSet):
    queryset = Evaluacion.objects.all()
    serializer_class = EvaluacionSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_estudiantes(request):
    """Obtener lista de estudiantes para evaluación"""
    try:
        estudiantes = Estudiante.objects.filter(estado='matriculado').order_by('grupo', 'nombre')
        data = []
        for estudiante in estudiantes:
            data.append({
                'id': estudiante.id,
                'nombre': estudiante.nombre,
                'grupo': estudiante.grupo,
                'documento': estudiante.documento
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_racs_aleatorios_por_gac(request):
    """Obtener 3 RACs aleatorios por cada GAC para evaluación"""
    try:
        gacs = GAC.objects.all().order_by('numero')
        racs_por_gac = {}
        
        for gac in gacs:
            # Obtener todos los RACs asociados a este GAC
            racs_del_gac = list(RAC.objects.filter(gacs=gac))
            
            # Seleccionar 3 RACs aleatorios
            if len(racs_del_gac) >= 3:
                racs_seleccionados = random.sample(racs_del_gac, 3)
            else:
                racs_seleccionados = racs_del_gac
            
            racs_por_gac[gac.numero] = []
            for rac in racs_seleccionados:
                racs_por_gac[gac.numero].append({
                    'id': rac.id,
                    'numero': rac.numero,
                    'descripcion': rac.descripcion
                })
        
        return Response({
            'racs_por_gac': racs_por_gac,
            'total_gacs': len(gacs),
            'total_racs_seleccionados': sum(len(racs) for racs in racs_por_gac.values())
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_racs(request):
    """Obtener lista de RACs para evaluación"""
    try:
        racs = RAC.objects.all().order_by('numero')
        data = []
        for rac in racs:
            data.append({
                'id': rac.id,
                'numero': rac.numero,
                'descripcion': rac.descripcion
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_evaluaciones_estudiante(request, estudiante_id):
    """Obtener evaluaciones existentes de un estudiante"""
    try:
        evaluaciones = Evaluacion.objects.filter(estudiante_id=estudiante_id)
        data = []
        for evaluacion in evaluaciones:
            data.append({
                'id': evaluacion.id,
                'rac_id': evaluacion.rac.id,
                'rac_numero': evaluacion.rac.numero,
                'rac_descripcion': evaluacion.rac.descripcion,
                'puntaje': float(evaluacion.puntaje),
                'fecha': evaluacion.fecha,
                'es_aprobado': evaluacion.es_aprobado
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_o_actualizar_evaluacion(request):
    """Crear o actualizar una evaluación"""
    try:
        estudiante_id = request.data.get('estudiante_id')
        rac_id = request.data.get('rac_id')
        puntaje = request.data.get('puntaje')
        profesor_id = request.user.id

        # Validar datos requeridos
        if not all([estudiante_id, rac_id, puntaje]):
            return Response(
                {'error': 'Todos los campos son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el puntaje esté entre 1 y 5
        try:
            puntaje_int = int(puntaje)
            if not (1 <= puntaje_int <= 5):
                return Response(
                    {'error': 'El puntaje debe estar entre 1 y 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'El puntaje debe ser un número entero entre 1 y 5'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el estudiante existe y esté matriculado
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id, estado='matriculado')
        except Estudiante.DoesNotExist:
            return Response(
                {'error': 'Estudiante no encontrado o no matriculado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que el RAC existe
        try:
            rac = RAC.objects.get(id=rac_id)
        except RAC.DoesNotExist:
            return Response(
                {'error': 'RAC no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Buscar si ya existe una evaluación para este estudiante y RAC
        evaluacion_existente = Evaluacion.objects.filter(
            estudiante_id=estudiante_id,
            rac_id=rac_id,
            profesor_id=profesor_id
        ).first()

        if evaluacion_existente:
            # Actualizar evaluación existente
            evaluacion_existente.puntaje = puntaje_int
            evaluacion_existente.save()
            evaluacion = evaluacion_existente
        else:
            # Crear nueva evaluación
            evaluacion = Evaluacion.objects.create(
                estudiante_id=estudiante_id,
                rac_id=rac_id,
                profesor_id=profesor_id,
                puntaje=puntaje_int
            )

        serializer = EvaluacionSerializer(evaluacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_evaluaciones_masivas(request):
    """Crear múltiples evaluaciones para un estudiante"""
    try:
        estudiante_id = request.data.get('estudiante_id')
        evaluaciones = request.data.get('evaluaciones', [])
        profesor_id = request.user.id

        # Validar datos requeridos
        if not estudiante_id or not evaluaciones:
            return Response(
                {'error': 'Estudiante y evaluaciones son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el estudiante existe y esté matriculado
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id, estado='matriculado')
        except Estudiante.DoesNotExist:
            return Response(
                {'error': 'Estudiante no encontrado o no matriculado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        resultados = []
        evaluaciones_creadas = []
        evaluaciones_actualizadas = []

        for eval_data in evaluaciones:
            rac_id = eval_data.get('rac_id')
            puntaje = eval_data.get('puntaje')

            # Validar datos de la evaluación
            if not rac_id or puntaje is None:
                resultados.append({
                    'rac_id': rac_id,
                    'error': 'RAC ID y puntaje son requeridos'
                })
                continue

            # Validar puntaje (1-5)
            try:
                puntaje_int = int(puntaje)
                if not (1 <= puntaje_int <= 5):
                    resultados.append({
                        'rac_id': rac_id,
                        'error': f'El puntaje debe estar entre 1 y 5 (recibido: {puntaje})'
                    })
                    continue
            except (ValueError, TypeError):
                resultados.append({
                    'rac_id': rac_id,
                    'error': f'El puntaje debe ser un número entero entre 1 y 5 (recibido: {puntaje})'
                })
                continue

            # Verificar que el RAC existe
            try:
                rac = RAC.objects.get(id=rac_id)
            except RAC.DoesNotExist:
                resultados.append({
                    'rac_id': rac_id,
                    'error': 'RAC no encontrado'
                })
                continue

            # Crear o actualizar evaluación
            evaluacion, created = Evaluacion.objects.update_or_create(
                estudiante_id=estudiante_id,
                rac_id=rac_id,
                profesor_id=profesor_id,
                defaults={'puntaje': puntaje_int}
            )

            if created:
                evaluaciones_creadas.append(rac_id)
            else:
                evaluaciones_actualizadas.append(rac_id)

            resultados.append({
                'rac_id': rac_id,
                'puntaje': puntaje_int,
                'created': created,
                'success': True
            })

        return Response({
            'message': 'Evaluaciones procesadas correctamente',
            'resultados': resultados,
            'resumen': {
                'total_procesadas': len(resultados),
                'creadas': len(evaluaciones_creadas),
                'actualizadas': len(evaluaciones_actualizadas),
                'errores': len([r for r in resultados if not r.get('success')])
            }
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_evaluaciones(request):
    """Obtener estadísticas generales de evaluaciones"""
    try:
        total_evaluaciones = Evaluacion.objects.count()
        total_estudiantes = Estudiante.objects.filter(estado='matriculado').count()
        total_racs = RAC.objects.count()
        
        # Promedio general de puntajes
        promedio_general = Evaluacion.objects.aggregate(
            promedio=Avg('puntaje')
        )['promedio'] or 0.0
        
        # Evaluaciones aprobadas vs reprobadas
        aprobadas = Evaluacion.objects.filter(puntaje__gte=3).count()
        reprobadas = total_evaluaciones - aprobadas
        
        # Top 5 RACs con mejor promedio
        top_racs = RAC.objects.annotate(
            promedio=Avg('evaluaciones__puntaje'),
            total_eval=Count('evaluaciones')
        ).filter(total_eval__gt=0).order_by('-promedio')[:5]
        
        top_racs_data = []
        for rac in top_racs:
            top_racs_data.append({
                'numero': rac.numero,
                'descripcion': rac.descripcion[:100] + "..." if len(rac.descripcion) > 100 else rac.descripcion,
                'promedio': float(rac.promedio or 0.0),
                'total_evaluaciones': rac.total_eval
            })

        return Response({
            'resumen_general': {
                'total_evaluaciones': total_evaluaciones,
                'total_estudiantes': total_estudiantes,
                'total_racs': total_racs,
                'promedio_general': float(promedio_general),
                'aprobadas': aprobadas,
                'reprobadas': reprobadas,
                'porcentaje_aprobacion': (aprobadas / total_evaluaciones * 100) if total_evaluaciones > 0 else 0
            },
            'top_racs': top_racs_data
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_por_gac(request):
    """Obtener estadísticas de evaluaciones por GAC"""
    try:
        gacs = GAC.objects.all().order_by('numero')
        estadisticas_gac = []
        
        for gac in gacs:
            # Obtener RACs del GAC
            racs_del_gac = RAC.objects.filter(gacs=gac)
            
            # Obtener evaluaciones de estos RACs
            evaluaciones_gac = Evaluacion.objects.filter(rac__in=racs_del_gac)
            
            if evaluaciones_gac.exists():
                promedio_gac = evaluaciones_gac.aggregate(
                    promedio=Avg('puntaje')
                )['promedio'] or 0.0
                
                aprobadas_gac = evaluaciones_gac.filter(puntaje__gte=3).count()
                total_gac = evaluaciones_gac.count()
                
                estadisticas_gac.append({
                    'gac_numero': gac.numero,
                    'gac_descripcion': gac.descripcion[:100] + "..." if len(gac.descripcion) > 100 else gac.descripcion,
                    'promedio': float(promedio_gac),
                    'total_evaluaciones': total_gac,
                    'aprobadas': aprobadas_gac,
                    'reprobadas': total_gac - aprobadas_gac,
                    'porcentaje_aprobacion': (aprobadas_gac / total_gac * 100) if total_gac > 0 else 0
                })
        
        return Response({
            'estadisticas_por_gac': estadisticas_gac,
            'total_gacs': len(estadisticas_gac)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resultados_estudiante(request, estudiante_id):
    """Obtener resultados detallados de un estudiante"""
    try:
        # Verificar que el estudiante existe
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id)
        except Estudiante.DoesNotExist:
            return Response(
                {'error': 'Estudiante no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener evaluaciones del estudiante agrupadas por GAC
        evaluaciones = Evaluacion.objects.filter(estudiante_id=estudiante_id).select_related('rac')
        
        resultados_por_gac = {}
        total_puntaje = 0
        total_evaluaciones = 0
        
        for evaluacion in evaluaciones:
            # Obtener GACs del RAC
            gacs_del_rac = evaluacion.rac.gacs.all()
            
            for gac in gacs_del_rac:
                if gac.numero not in resultados_por_gac:
                    resultados_por_gac[gac.numero] = {
                        'gac_numero': gac.numero,
                        'gac_descripcion': gac.descripcion,
                        'racs': [],
                        'promedio_gac': 0,
                        'total_racs': 0
                    }
                
                # Agregar RAC a la lista
                rac_info = {
                    'rac_numero': evaluacion.rac.numero,
                    'rac_descripcion': evaluacion.rac.descripcion,
                    'puntaje': evaluacion.puntaje,
                    'es_aprobado': evaluacion.es_aprobado,
                    'fecha': evaluacion.fecha
                }
                
                if rac_info not in resultados_por_gac[gac.numero]['racs']:
                    resultados_por_gac[gac.numero]['racs'].append(rac_info)
                    resultados_por_gac[gac.numero]['total_racs'] += 1
                
                total_puntaje += evaluacion.puntaje
                total_evaluaciones += 1
        
        # Calcular promedios por GAC
        for gac_numero in resultados_por_gac:
            racs_gac = resultados_por_gac[gac_numero]['racs']
            if racs_gac:
                puntaje_total_gac = sum(rac['puntaje'] for rac in racs_gac)
                resultados_por_gac[gac_numero]['promedio_gac'] = puntaje_total_gac / len(racs_gac)
        
        # Calcular promedio general
        promedio_general = total_puntaje / total_evaluaciones if total_evaluaciones > 0 else 0
        
        return Response({
            'estudiante': {
                'id': estudiante.id,
                'nombre': estudiante.nombre,
                'grupo': estudiante.grupo,
                'documento': estudiante.documento,
                'estado': estudiante.estado
            },
            'resultados_por_gac': list(resultados_por_gac.values()),
            'resumen_general': {
                'total_evaluaciones': total_evaluaciones,
                'promedio_general': float(promedio_general),
                'total_gacs_evaluados': len(resultados_por_gac)
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
