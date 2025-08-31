from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import GAC, RAC, Materia, Evaluacion
from .serializers import GACSerializer, RACSerializer, MateriaSerializer, EvaluacionSerializer , EstadisticaGACSerializer
from usuarios.models import Profesor, Estudiante
from django.db.models import Avg, Count, F, Max
import random
from django.http import JsonResponse
import logging

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

from django.db.models import Avg, Count, F
from django.db.models import Q

from django.db.models import Avg, Count, Max, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Evaluacion, Estudiante, GAC

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Count

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_evaluaciones(request):
    try:
        # Evaluaciones únicas por (profesor, estudiante) -> tomar la última fecha
        evaluaciones_unicas = (
            Evaluacion.objects
            .values('profesor', 'estudiante', 'rac__gacs')
            .annotate(ultima_fecha=Max('fecha'), puntaje=Max('puntaje'))
        )

        total_evaluaciones = evaluaciones_unicas.count()
        total_estudiantes = Evaluacion.objects.values('estudiante').distinct().count()

        # Promedio general de todas las evaluaciones
        promedio_general = Evaluacion.objects.aggregate(promedio=Avg('puntaje'))['promedio'] or 0.0

        # Aprobadas / Reprobadas basado en evaluaciones únicas
        aprobadas = sum(1 for e in evaluaciones_unicas if e['puntaje'] >= 3)
        reprobadas = total_evaluaciones - aprobadas
        porcentaje_aprobacion = (aprobadas / total_evaluaciones * 100) if total_evaluaciones > 0 else 0

        # Datos por estudiante para BI
        estudiantes_data = []
        estudiantes_qs = Estudiante.objects.all()
        for est in estudiantes_qs:
            est_evals = evaluaciones_unicas.filter(estudiante=est.id)
            for e in est_evals:
                gac_obj = GAC.objects.get(id=e['rac__gacs'])
                estudiantes_data.append({
                    "estudiante": est.nombre,
                    "gac": gac_obj.numero,
                    "gac_descripcion": gac_obj.descripcion,
                    "puntaje": e['puntaje']
                })

        # Top 5 GACs
        top_gacs_data = []
        gacs = GAC.objects.all()
        for g in gacs:
            evals_gac = [e for e in evaluaciones_unicas if e['rac__gacs'] == g.id]
            total = len(evals_gac)
            aprobadas_gac = sum(1 for e in evals_gac if e['puntaje'] >= 3)
            reprobadas_gac = total - aprobadas_gac
            promedio_gac = sum(e['puntaje'] for e in evals_gac) / total if total > 0 else 0
            porcentaje_aprobacion_gac = (aprobadas_gac / total * 100) if total > 0 else 0
            top_gacs_data.append({
                "gac_numero": g.numero,
                "gac_descripcion": g.descripcion,
                "promedio": round(promedio_gac, 2),
                "total_evaluaciones": total,
                "aprobadas": aprobadas_gac,
                "reprobadas": reprobadas_gac,
                "porcentaje_aprobacion": porcentaje_aprobacion_gac
            })

        return Response({
            "resumen_general": {
                "total_evaluaciones": total_evaluaciones,
                "total_estudiantes": total_estudiantes,
                "promedio_general": round(promedio_general, 2),
                "aprobadas": aprobadas,
                "reprobadas": reprobadas,
                "porcentaje_aprobacion": round(porcentaje_aprobacion, 2)
            },
            "top_gacs": top_gacs_data,
            "estudiantes": estudiantes_data
        })
    except Exception as e:
        print("Error en estadisticas_evaluaciones:", e)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_por_gac(request):
    """Obtener estadísticas de evaluaciones por cada GAC"""
    try:
        gacs = GAC.objects.all().order_by('numero')
        estadisticas_gac = []

        for gac in gacs:
            evaluaciones_gac = Evaluacion.objects.filter(rac__gacs=gac)

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

        serializer = EstadisticaGACSerializer(estadisticas_gac, many=True)
        return Response({
            'estadisticas_por_gac': serializer.data,
            'total_gacs': len(serializer.data)
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resultados_estudiante(request, estudiante_id):
    try:
        estudiante = Estudiante.objects.get(pk=estudiante_id)

        # Todas las evaluaciones del estudiante
        evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)

        # Promedio general
        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0

        # Totales
        total_evaluaciones = evaluaciones.values("profesor").distinct().count()
        total_gacs = evaluaciones.values("rac__gacs__id").distinct().count()
        total_racs = evaluaciones.values("rac__id").distinct().count()

        # === Gráfico: promedio por profesor ===
        grafico_profesores_qs = (
            evaluaciones.values("profesor__nombre")
            .annotate(promedio=Avg("puntaje"))
            .order_by("profesor__nombre")
        )
        grafico_profesores = [
            {"profesor": g["profesor__nombre"], "promedio": round(g["promedio"], 2)}
            for g in grafico_profesores_qs
        ]

        # === Gráfico: promedio por GAC ===
        grafico_gacs_qs = (
            evaluaciones.values("rac__gacs__id")
            .annotate(
                numero=F("rac__gacs__numero"),
                descripcion=F("rac__gacs__descripcion"),
                promedio=Avg("puntaje"),
            )
            .order_by("numero")
        )
        grafico_gacs = [
            {
                "gac": f"GAC {g['numero']}",
                "descripcion": g["descripcion"],
                "promedio": round(g["promedio"], 2),
            }
            for g in grafico_gacs_qs
        ]

        # === Lista de evaluaciones detalladas ===
        evaluaciones_detalle = [
            {
                "profesor": e.profesor.nombre,
                "rac_numero": e.rac.numero,
                "rac_descripcion": e.rac.descripcion,
                "puntaje": e.puntaje,
            }
            for e in evaluaciones
        ]

        data = {
            "resumen_general": {
                "promedio_general": round(promedio_general, 2),
                "total_evaluaciones": total_evaluaciones,
                "total_gacs_evaluados": total_gacs,
                "total_racs_evaluados": total_racs,
            },
            "grafico_profesores": grafico_profesores,
            "grafico_gacs": grafico_gacs,
            "evaluaciones": evaluaciones_detalle,  # <-- Aquí se añade la lista
        }

        return JsonResponse(data, safe=False)

    except Estudiante.DoesNotExist:
        return JsonResponse({"error": "Estudiante no encontrado"}, status=404)
