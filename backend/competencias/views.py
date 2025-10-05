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
from django.http import JsonResponse, HttpResponse
import logging
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import io

# Create your views here.

class GACViewSet(viewsets.ModelViewSet):
    queryset = GAC.objects.all()
    serializer_class = GACSerializer
    permission_classes = [IsAuthenticated]

class RACViewSet(viewsets.ModelViewSet):
    queryset = RAC.objects.all()
    serializer_class = RACSerializer
    permission_classes = [IsAuthenticated]

class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer
    permission_classes = [IsAuthenticated]

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resultados_estudiante_por_semestre(request, estudiante_id):
    """Obtener resultados de un estudiante separados por semestre"""
    try:
        estudiante = Estudiante.objects.get(pk=estudiante_id)
        
        # Definir grupos por semestre
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        # Determinar el semestre actual del estudiante
        grupo_actual = estudiante.grupo
        es_segundo_semestre = grupo_actual in segundo_semestre
        
        # Obtener todas las evaluaciones del estudiante
        evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)
        
        # Separar evaluaciones por semestre basándose en el grupo actual
        evaluaciones_primer_semestre = []
        evaluaciones_segundo_semestre = []
        
        for evaluacion in evaluaciones:
            # Si el estudiante está en segundo semestre, asumimos que las evaluaciones más antiguas son de primer semestre
            # y las más recientes son de segundo semestre
            if es_segundo_semestre:
                # Por ahora, todas las evaluaciones se consideran del semestre actual
                # En el futuro se podría mejorar esta lógica basándose en fechas
                evaluaciones_segundo_semestre.append(evaluacion)
            else:
                evaluaciones_primer_semestre.append(evaluacion)
        
        def procesar_evaluaciones(evaluaciones_list, semestre_nombre):
            if not evaluaciones_list:
                return {
                    "semestre": semestre_nombre,
                    "resumen_general": {
                        "promedio_general": 0,
                        "total_evaluaciones": 0,
                        "total_gacs_evaluados": 0,
                        "total_racs_evaluados": 0,
                    },
                    "grafico_profesores": [],
                    "grafico_gacs": [],
                    "evaluaciones": [],
                }
            
            # Promedio general
            promedio_general = sum(e.puntaje for e in evaluaciones_list) / len(evaluaciones_list)
            
            # Totales
            total_evaluaciones = len(set(e.profesor.id for e in evaluaciones_list))
            total_gacs = len(set(gac.id for e in evaluaciones_list for gac in e.rac.gacs.all()))
            total_racs = len(set(e.rac.id for e in evaluaciones_list))
            
            # === Gráfico: promedio por profesor ===
            profesores_data = {}
            for e in evaluaciones_list:
                if e.profesor.nombre not in profesores_data:
                    profesores_data[e.profesor.nombre] = []
                profesores_data[e.profesor.nombre].append(e.puntaje)
            
            grafico_profesores = [
                {"profesor": nombre, "promedio": round(sum(puntajes) / len(puntajes), 2)}
                for nombre, puntajes in profesores_data.items()
            ]
            
            # === Gráfico: promedio por GAC ===
            gacs_data = {}
            for e in evaluaciones_list:
                for gac in e.rac.gacs.all():
                    gac_key = f"GAC {gac.numero}"
                    if gac_key not in gacs_data:
                        gacs_data[gac_key] = {
                            "gac": gac_key,
                            "descripcion": gac.descripcion,
                            "puntajes": []
                        }
                    gacs_data[gac_key]["puntajes"].append(e.puntaje)
            
            grafico_gacs = [
                {
                    "gac": data["gac"],
                    "descripcion": data["descripcion"],
                    "promedio": round(sum(data["puntajes"]) / len(data["puntajes"]), 2)
                }
                for data in gacs_data.values()
            ]
            
            # === Lista de evaluaciones detalladas ===
            evaluaciones_detalle = [
                {
                    "profesor": e.profesor.nombre,
                    "rac_numero": e.rac.numero,
                    "rac_descripcion": e.rac.descripcion,
                    "puntaje": e.puntaje,
                }
                for e in evaluaciones_list
            ]
            
            return {
                "semestre": semestre_nombre,
                "resumen_general": {
                    "promedio_general": round(promedio_general, 2),
                    "total_evaluaciones": total_evaluaciones,
                    "total_gacs_evaluados": total_gacs,
                    "total_racs_evaluados": total_racs,
                },
                "grafico_profesores": grafico_profesores,
                "grafico_gacs": grafico_gacs,
                "evaluaciones": evaluaciones_detalle,
            }
        
        # Procesar datos para cada semestre
        datos_primer_semestre = procesar_evaluaciones(evaluaciones_primer_semestre, "Primer Semestre")
        datos_segundo_semestre = procesar_evaluaciones(evaluaciones_segundo_semestre, "Segundo Semestre")
        
        # Si el estudiante está en segundo semestre, también buscar datos de primer semestre
        if es_segundo_semestre:
            # Buscar si hay un estudiante con el mismo documento pero en grupo de primer semestre
            # Esto asume que el estudiante mantiene el mismo documento
            try:
                estudiante_primer_semestre = Estudiante.objects.filter(
                    documento=estudiante.documento,
                    grupo__in=primer_semestre
                ).first()
                
                if estudiante_primer_semestre:
                    evaluaciones_primer_semestre = Evaluacion.objects.filter(
                        estudiante=estudiante_primer_semestre
                    )
                    datos_primer_semestre = procesar_evaluaciones(
                        list(evaluaciones_primer_semestre), 
                        "Primer Semestre"
                    )
            except Exception as e:
                print(f"Error buscando estudiante de primer semestre: {e}")
        
        data = {
            "estudiante": {
                "id": estudiante.id,
                "nombre": estudiante.nombre,
                "grupo": estudiante.grupo,
                "documento": estudiante.documento,
                "es_segundo_semestre": es_segundo_semestre,
            },
            "primer_semestre": datos_primer_semestre,
            "segundo_semestre": datos_segundo_semestre,
        }
        
        return JsonResponse(data, safe=False)
        
    except Estudiante.DoesNotExist:
        return JsonResponse({"error": "Estudiante no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resultados_globales(request):
    try:
        # Todas las evaluaciones
        evaluaciones = Evaluacion.objects.all()

        # Promedio general
        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0

        # Totales
        total_evaluaciones = evaluaciones.values("profesor", "estudiante").distinct().count()
        total_gacs = evaluaciones.values("rac__gacs__id").distinct().count()
        total_racs = evaluaciones.values("rac__id").distinct().count()
        total_estudiantes = evaluaciones.values("estudiante").distinct().count()
        total_profesores = evaluaciones.values("profesor").distinct().count()

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

        # === Gráfico: promedio por estudiante ===
        grafico_estudiantes_qs = (
            evaluaciones.values("estudiante__nombre")
            .annotate(promedio=Avg("puntaje"))
            .order_by("estudiante__nombre")
        )
        grafico_estudiantes = [
            {"estudiante": g["estudiante__nombre"], "promedio": round(g["promedio"], 2)}
            for g in grafico_estudiantes_qs
        ]

        # === Lista de evaluaciones detalladas ===
        evaluaciones_detalle = [
            {
                "estudiante": e.estudiante.nombre,
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
                "total_estudiantes": total_estudiantes,
                "total_profesores": total_profesores,
            },
            "grafico_profesores": grafico_profesores,
            "grafico_gacs": grafico_gacs,
            "grafico_estudiantes": grafico_estudiantes,
            "evaluaciones": evaluaciones_detalle,
        }

        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def informes_por_gac_semestre(request):
    """Obtener promedios de GAC por semestre"""
    try:
        # Definir grupos por semestre
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        # Obtener evaluaciones agrupadas por GAC y semestre
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'rac').prefetch_related('rac__gacs').all()
        
        # Verificar si hay evaluaciones
        if not evaluaciones.exists():
            return JsonResponse({
                'gacs_por_semestre': [],
                'message': 'No hay evaluaciones disponibles'
            }, safe=False)
        
        # Agrupar por GAC y semestre
        gacs_data = {}
        
        for evaluacion in evaluaciones:
            try:
                grupo = evaluacion.estudiante.grupo
                
                # Determinar semestre
                if grupo in primer_semestre:
                    semestre = 'Primer Semestre'
                elif grupo in segundo_semestre:
                    semestre = 'Segundo Semestre'
                else:
                    continue  # Saltar grupos que no pertenecen a ningún semestre
                
                # Un RAC puede tener múltiples GACs
                for gac in evaluacion.rac.gacs.all():
                    gac_numero = gac.numero
                    
                    if gac_numero not in gacs_data:
                        gacs_data[gac_numero] = {
                            'gac_numero': gac_numero,
                            'gac_descripcion': gac.descripcion,
                            'primer_semestre': {'puntajes': [], 'promedio': 0},
                            'segundo_semestre': {'puntajes': [], 'promedio': 0}
                        }
                    
                    gacs_data[gac_numero][f"{semestre.lower().replace(' ', '_')}"]['puntajes'].append(evaluacion.puntaje)
            except Exception as e:
                print(f"Error procesando evaluación {evaluacion.id}: {e}")
                continue
        
        # Calcular promedios
        resultado = []
        for gac_data in gacs_data.values():
            # Primer semestre
            if gac_data['primer_semestre']['puntajes']:
                gac_data['primer_semestre']['promedio'] = sum(gac_data['primer_semestre']['puntajes']) / len(gac_data['primer_semestre']['puntajes'])
                gac_data['primer_semestre']['total_evaluaciones'] = len(gac_data['primer_semestre']['puntajes'])
            else:
                gac_data['primer_semestre']['total_evaluaciones'] = 0
            
            # Segundo semestre
            if gac_data['segundo_semestre']['puntajes']:
                gac_data['segundo_semestre']['promedio'] = sum(gac_data['segundo_semestre']['puntajes']) / len(gac_data['segundo_semestre']['puntajes'])
                gac_data['segundo_semestre']['total_evaluaciones'] = len(gac_data['segundo_semestre']['puntajes'])
            else:
                gac_data['segundo_semestre']['total_evaluaciones'] = 0
            
            # Limpiar datos
            del gac_data['primer_semestre']['puntajes']
            del gac_data['segundo_semestre']['puntajes']
            
            resultado.append(gac_data)
        
        return JsonResponse({'gacs_por_semestre': resultado}, safe=False)
        
    except Exception as e:
        print(f"Error en informes_por_gac_semestre: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def informes_por_profesor_materia(request):
    """Obtener promedios por profesor y materia con semaforización"""
    try:
        # Obtener evaluaciones con información de profesor, materia y estudiante
        evaluaciones = Evaluacion.objects.select_related(
            'profesor', 'estudiante', 'rac'
        ).prefetch_related('rac__materias').all()
        
        # Verificar si hay evaluaciones
        if not evaluaciones.exists():
            return JsonResponse({
                'profesores_materias': [],
                'message': 'No hay evaluaciones disponibles'
            }, safe=False)
        
        # Agrupar por profesor y materia
        profesores_data = {}
        
        for evaluacion in evaluaciones:
            try:
                profesor_id = evaluacion.profesor.id
                profesor_nombre = evaluacion.profesor.nombre
                
                # Obtener materias del RAC
                materias = evaluacion.rac.materias.all()
                
                for materia in materias:
                    materia_id = materia.id
                    materia_nombre = materia.nombre
                    
                    key = f"{profesor_id}_{materia_id}"
                    
                    if key not in profesores_data:
                        profesores_data[key] = {
                            'profesor_id': profesor_id,
                            'profesor_nombre': profesor_nombre,
                            'materia_id': materia_id,
                            'materia_nombre': materia_nombre,
                            'puntajes': [],
                            'estudiantes_evaluados': set(),
                            'total_estudiantes': 0
                        }
                    
                    profesores_data[key]['puntajes'].append(evaluacion.puntaje)
                    profesores_data[key]['estudiantes_evaluados'].add(evaluacion.estudiante.id)
            except Exception as e:
                print(f"Error procesando evaluación {evaluacion.id}: {e}")
                continue
        
        # Calcular total de estudiantes por materia (todos los estudiantes que tienen RACs de esa materia)
        from django.db.models import Count
        for key, data in profesores_data.items():
            try:
                materia_id = data['materia_id']
                # Contar estudiantes únicos que tienen RACs de esta materia
                total_estudiantes = Evaluacion.objects.filter(
                    rac__materias__id=materia_id
                ).values('estudiante').distinct().count()
                data['total_estudiantes'] = total_estudiantes
            except Exception as e:
                print(f"Error calculando total estudiantes para materia {data['materia_id']}: {e}")
                data['total_estudiantes'] = 0
        
        # Calcular promedios y porcentajes
        resultado = []
        for data in profesores_data.values():
            if data['puntajes']:
                promedio = sum(data['puntajes']) / len(data['puntajes'])
                estudiantes_evaluados = len(data['estudiantes_evaluados'])
                total_estudiantes = data['total_estudiantes']
                
                # Calcular porcentaje de evaluación
                porcentaje_evaluacion = (estudiantes_evaluados / total_estudiantes * 100) if total_estudiantes > 0 else 0
                
                # Semaforización
                if porcentaje_evaluacion <= 30:
                    color_semaforo = 'rojo'
                elif porcentaje_evaluacion <= 60:
                    color_semaforo = 'amarillo'
                else:
                    color_semaforo = 'verde'
                
                resultado.append({
                    'profesor_id': data['profesor_id'],
                    'profesor_nombre': data['profesor_nombre'],
                    'materia_id': data['materia_id'],
                    'materia_nombre': data['materia_nombre'],
                    'promedio': round(promedio, 2),
                    'estudiantes_evaluados': estudiantes_evaluados,
                    'total_estudiantes': total_estudiantes,
                    'porcentaje_evaluacion': round(porcentaje_evaluacion, 1),
                    'color_semaforo': color_semaforo
                })
        
        return JsonResponse({'profesores_materias': resultado}, safe=False)
        
    except Exception as e:
        print(f"Error en informes_por_profesor_materia: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def informes_por_estudiante_profesores(request):
    """Obtener promedios por estudiante y profesores evaluadores"""
    try:
        # Obtener evaluaciones con información de estudiante y profesor
        evaluaciones = Evaluacion.objects.select_related(
            'estudiante', 'profesor'
        ).all()
        
        # Agrupar por estudiante
        estudiantes_data = {}
        
        for evaluacion in evaluaciones:
            estudiante_id = evaluacion.estudiante.id
            estudiante_nombre = evaluacion.estudiante.nombre
            estudiante_grupo = evaluacion.estudiante.grupo
            
            if estudiante_id not in estudiantes_data:
                estudiantes_data[estudiante_id] = {
                    'estudiante_id': estudiante_id,
                    'estudiante_nombre': estudiante_nombre,
                    'estudiante_grupo': estudiante_grupo,
                    'puntajes': [],
                    'profesores_evaluadores': set()
                }
            
            estudiantes_data[estudiante_id]['puntajes'].append(evaluacion.puntaje)
            estudiantes_data[estudiante_id]['profesores_evaluadores'].add(evaluacion.profesor.nombre)
        
        # Calcular promedios
        resultado = []
        for data in estudiantes_data.values():
            if data['puntajes']:
                promedio = sum(data['puntajes']) / len(data['puntajes'])
                
                resultado.append({
                    'estudiante_id': data['estudiante_id'],
                    'estudiante_nombre': data['estudiante_nombre'],
                    'estudiante_grupo': data['estudiante_grupo'],
                    'promedio': round(promedio, 2),
                    'total_evaluaciones': len(data['puntajes']),
                    'profesores_evaluadores': list(data['profesores_evaluadores'])
                })
        
        # Ordenar por promedio descendente
        resultado.sort(key=lambda x: x['promedio'], reverse=True)
        
        return JsonResponse({'estudiantes_profesores': resultado}, safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def informes_detalle_profesor_materia(request, profesor_id, materia_id):
    """Obtener detalle de estudiantes evaluados por un profesor en una materia específica"""
    try:
        # Obtener evaluaciones del profesor en la materia específica
        evaluaciones = Evaluacion.objects.filter(
            profesor_id=profesor_id,
            rac__materias__id=materia_id
        ).select_related('estudiante', 'rac').all()
        
        # Obtener información del profesor y materia
        from usuarios.models import Profesor
        from .models import Materia
        
        try:
            profesor = Profesor.objects.get(id=profesor_id)
            materia = Materia.objects.get(id=materia_id)
        except (Profesor.DoesNotExist, Materia.DoesNotExist):
            return JsonResponse({"error": "Profesor o materia no encontrado"}, status=404)
        
        # Agrupar por estudiante
        estudiantes_data = {}
        
        for evaluacion in evaluaciones:
            estudiante_id = evaluacion.estudiante.id
            estudiante_nombre = evaluacion.estudiante.nombre
            estudiante_grupo = evaluacion.estudiante.grupo
            
            if estudiante_id not in estudiantes_data:
                estudiantes_data[estudiante_id] = {
                    'estudiante_id': estudiante_id,
                    'estudiante_nombre': estudiante_nombre,
                    'estudiante_grupo': estudiante_grupo,
                    'evaluaciones': []
                }
            
            estudiantes_data[estudiante_id]['evaluaciones'].append({
                'rac_numero': evaluacion.rac.numero,
                'rac_descripcion': evaluacion.rac.descripcion,
                'puntaje': evaluacion.puntaje,
                'fecha': evaluacion.fecha
            })
        
        # Calcular promedios por estudiante
        resultado = []
        for data in estudiantes_data.values():
            puntajes = [eval['puntaje'] for eval in data['evaluaciones']]
            promedio = sum(puntajes) / len(puntajes) if puntajes else 0
            
            resultado.append({
                'estudiante_id': data['estudiante_id'],
                'estudiante_nombre': data['estudiante_nombre'],
                'estudiante_grupo': data['estudiante_grupo'],
                'promedio': round(promedio, 2),
                'total_evaluaciones': len(data['evaluaciones']),
                'evaluaciones': data['evaluaciones']
            })
        
        # Ordenar por promedio descendente
        resultado.sort(key=lambda x: x['promedio'], reverse=True)
        
        return JsonResponse({
            'profesor_nombre': profesor.nombre,
            'materia_nombre': materia.nombre,
            'estudiantes': resultado
        }, safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_datos(request):
    """API de debug para verificar datos en la base de datos"""
    try:
        # Contar registros
        total_evaluaciones = Evaluacion.objects.count()
        total_estudiantes = Estudiante.objects.count()
        total_profesores = Profesor.objects.count()
        total_gacs = GAC.objects.count()
        total_racs = RAC.objects.count()
        total_materias = Materia.objects.count()
        
        # Obtener algunos ejemplos
        evaluaciones_ejemplo = list(Evaluacion.objects.select_related('estudiante', 'profesor', 'rac__gacs').values(
            'id', 'puntaje', 'estudiante__nombre', 'estudiante__grupo', 
            'profesor__nombre', 'rac__numero', 'rac__gacs__numero'
        )[:5])
        
        estudiantes_ejemplo = list(Estudiante.objects.values('id', 'nombre', 'grupo')[:5])
        
        return JsonResponse({
            'conteos': {
                'evaluaciones': total_evaluaciones,
                'estudiantes': total_estudiantes,
                'profesores': total_profesores,
                'gacs': total_gacs,
                'racs': total_racs,
                'materias': total_materias
            },
            'evaluaciones_ejemplo': evaluaciones_ejemplo,
            'estudiantes_ejemplo': estudiantes_ejemplo
        }, safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_todas_materias(request):
    """Obtener todas las materias disponibles"""
    try:
        materias = Materia.objects.all()
        
        materias_data = []
        for materia in materias:
            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion
            })
        
        return JsonResponse(materias_data, safe=False)
        
    except Exception as e:
        print(f"Error en obtener_todas_materias: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_materias_profesor(request):
    """Obtener materias asignadas al profesor autenticado"""
    try:
        profesor = request.user
        
        # Verificar que el usuario es un profesor
        if not hasattr(profesor, 'materias'):
            return JsonResponse({"error": "Usuario no es un profesor"}, status=400)
        
        materias = profesor.materias.all()
        
        materias_data = []
        for materia in materias:
            materias_data.append({
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion
            })
        
        return JsonResponse({'materias': materias_data}, safe=False)
        
    except Exception as e:
        print(f"Error en obtener_materias_profesor: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_gacs_por_materia(request, materia_id):
    """Obtener GACs relacionados a una materia específica"""
    try:
        from .models import Materia, RAC
        
        # Verificar que la materia existe
        try:
            materia = Materia.objects.get(id=materia_id)
        except Materia.DoesNotExist:
            return JsonResponse({"error": "Materia no encontrada"}, status=404)
        
        # Obtener RACs que pertenecen a esta materia
        racs = RAC.objects.filter(materias__id=materia_id).prefetch_related('gacs')
        
        # Agrupar RACs por GAC
        gacs_data = {}
        for rac in racs:
            # Un RAC puede tener múltiples GACs
            for gac in rac.gacs.all():
                gac_numero = gac.numero
                if gac_numero not in gacs_data:
                    gacs_data[gac_numero] = {
                        'gac_numero': gac_numero,
                        'gac_descripcion': gac.descripcion,
                        'racs': []
                    }
                
                gacs_data[gac_numero]['racs'].append({
                    'id': rac.id,
                    'numero': rac.numero,
                    'descripcion': rac.descripcion
                })
        
        # Seleccionar solo 3 RACs por GAC (aleatoriamente)
        import random
        resultado = []
        for gac_data in gacs_data.values():
            # Mezclar los RACs y tomar solo 3
            racs_disponibles = gac_data['racs']
            random.shuffle(racs_disponibles)
            gac_data['racs'] = racs_disponibles[:3]
            resultado.append(gac_data)
        
        # Ordenar por número de GAC
        resultado.sort(key=lambda x: x['gac_numero'])
        
        return JsonResponse({
            'materia': {
                'id': materia.id,
                'nombre': materia.nombre,
                'descripcion': materia.descripcion
            },
            'gacs': resultado
        }, safe=False)
        
    except Exception as e:
        print(f"Error en obtener_gacs_por_materia: {e}")
        return JsonResponse({"error": str(e)}, status=500)

# ==================== FUNCIONES PARA GENERAR PDFs ====================

def crear_estilos_pdf():
    """Crear estilos personalizados para los PDFs"""
    styles = getSampleStyleSheet()
    
    # Estilo para título principal
    titulo_style = ParagraphStyle(
        'TituloPrincipal',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    # Estilo para subtítulos
    subtitulo_style = ParagraphStyle(
        'Subtitulo',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=20,
        alignment=TA_LEFT,
        textColor=colors.darkblue
    )
    
    # Estilo para texto normal
    texto_style = ParagraphStyle(
        'TextoNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=12,
        alignment=TA_LEFT
    )
    
    return {
        'titulo': titulo_style,
        'subtitulo': subtitulo_style,
        'texto': texto_style,
        'normal': styles['Normal']
    }

def crear_tabla_pdf(data, headers, col_widths=None):
    """Crear una tabla para el PDF"""
    if not data:
        data = [['No hay datos disponibles']]
    
    # Agregar headers si no están incluidos en los datos
    if headers and data[0] != headers:
        data.insert(0, headers)
    
    # Crear la tabla
    table = Table(data)
    
    # Estilo de la tabla
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ])
    
    table.setStyle(table_style)
    return table

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_resumen_general(request):
    """Descargar PDF del resumen general"""
    try:
        # Obtener datos del resumen general
        evaluaciones = Evaluacion.objects.all()
        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
        total_evaluaciones = evaluaciones.values("profesor", "estudiante").distinct().count()
        total_estudiantes = evaluaciones.values("estudiante").distinct().count()
        total_profesores = evaluaciones.values("profesor").distinct().count()
        total_gacs = evaluaciones.values("rac__gacs__id").distinct().count()

        # Crear buffer para el PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        estilos = crear_estilos_pdf()

        # Título
        story.append(Paragraph("INFORME RESUMEN GENERAL", estilos['titulo']))
        story.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos['texto']))
        story.append(Spacer(1, 20))

        # Resumen general
        story.append(Paragraph("RESUMEN GENERAL", estilos['subtitulo']))
        resumen_data = [
            ['Métrica', 'Valor'],
            ['Total de Evaluaciones', str(total_evaluaciones)],
            ['Total de Estudiantes', str(total_estudiantes)],
            ['Total de Profesores', str(total_profesores)],
            ['Total de GACs Evaluados', str(total_gacs)],
            ['Promedio General', f"{promedio_general:.2f}"]
        ]
        story.append(crear_tabla_pdf(resumen_data, None))
        story.append(Spacer(1, 20))

        # Gráfico por GAC
        story.append(Paragraph("PROMEDIO POR GAC", estilos['subtitulo']))
        grafico_gacs_qs = (
            evaluaciones.values("rac__gacs__id")
            .annotate(
                numero=F("rac__gacs__numero"),
                descripcion=F("rac__gacs__descripcion"),
                promedio=Avg("puntaje"),
            )
            .order_by("numero")
        )
        
        gac_data = [['GAC', 'Descripción', 'Promedio']]
        for g in grafico_gacs_qs:
            gac_data.append([
                f"GAC {g['numero']}",
                g["descripcion"][:50] + "..." if len(g["descripcion"]) > 50 else g["descripcion"],
                f"{g['promedio']:.2f}"
            ])
        
        story.append(crear_tabla_pdf(gac_data, None))
        story.append(Spacer(1, 20))

        # Gráfico por Profesor
        story.append(Paragraph("PROMEDIO POR PROFESOR", estilos['subtitulo']))
        grafico_profesores_qs = (
            evaluaciones.values("profesor__nombre")
            .annotate(promedio=Avg("puntaje"))
            .order_by("profesor__nombre")
        )
        
        profesor_data = [['Profesor', 'Promedio']]
        for g in grafico_profesores_qs:
            profesor_data.append([g["profesor__nombre"], f"{g['promedio']:.2f}"])
        
        story.append(crear_tabla_pdf(profesor_data, None))

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="resumen_general_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_por_gac(request):
    """Descargar PDF del informe por GAC"""
    try:
        # Obtener datos del informe por GAC
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'rac').prefetch_related('rac__gacs').all()
        
        if not evaluaciones.exists():
            return JsonResponse({'error': 'No hay evaluaciones disponibles'}, status=404)
        
        # Procesar datos (mismo código que en informes_por_gac_semestre)
        gacs_data = {}
        
        for evaluacion in evaluaciones:
            try:
                grupo = evaluacion.estudiante.grupo
                
                if grupo in primer_semestre:
                    semestre = 'Primer Semestre'
                elif grupo in segundo_semestre:
                    semestre = 'Segundo Semestre'
                else:
                    continue
                
                for gac in evaluacion.rac.gacs.all():
                    gac_numero = gac.numero
                    
                    if gac_numero not in gacs_data:
                        gacs_data[gac_numero] = {
                            'gac_numero': gac_numero,
                            'gac_descripcion': gac.descripcion,
                            'primer_semestre': {'puntajes': [], 'promedio': 0},
                            'segundo_semestre': {'puntajes': [], 'promedio': 0}
                        }
                    
                    gacs_data[gac_numero][f"{semestre.lower().replace(' ', '_')}"]['puntajes'].append(evaluacion.puntaje)
            except Exception as e:
                continue
        
        # Calcular promedios
        for gac_data in gacs_data.values():
            if gac_data['primer_semestre']['puntajes']:
                gac_data['primer_semestre']['promedio'] = sum(gac_data['primer_semestre']['puntajes']) / len(gac_data['primer_semestre']['puntajes'])
                gac_data['primer_semestre']['total_evaluaciones'] = len(gac_data['primer_semestre']['puntajes'])
            else:
                gac_data['primer_semestre']['total_evaluaciones'] = 0
            
            if gac_data['segundo_semestre']['puntajes']:
                gac_data['segundo_semestre']['promedio'] = sum(gac_data['segundo_semestre']['puntajes']) / len(gac_data['segundo_semestre']['puntajes'])
                gac_data['segundo_semestre']['total_evaluaciones'] = len(gac_data['segundo_semestre']['puntajes'])
            else:
                gac_data['segundo_semestre']['total_evaluaciones'] = 0

        # Crear PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        estilos = crear_estilos_pdf()

        # Título
        story.append(Paragraph("INFORME POR GAC", estilos['titulo']))
        story.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos['texto']))
        story.append(Spacer(1, 20))

        # Tabla de datos
        story.append(Paragraph("PROMEDIOS DE GAC POR SEMESTRE", estilos['subtitulo']))
        
        gac_data_table = [['GAC', 'Descripción', '1er Semestre', 'Evaluaciones 1er', '2do Semestre', 'Evaluaciones 2do']]
        for gac_data in sorted(gacs_data.values(), key=lambda x: x['gac_numero']):
            gac_data_table.append([
                f"GAC {gac_data['gac_numero']}",
                gac_data['gac_descripcion'][:30] + "..." if len(gac_data['gac_descripcion']) > 30 else gac_data['gac_descripcion'],
                f"{gac_data['primer_semestre']['promedio']:.2f}",
                str(gac_data['primer_semestre']['total_evaluaciones']),
                f"{gac_data['segundo_semestre']['promedio']:.2f}",
                str(gac_data['segundo_semestre']['total_evaluaciones'])
            ])
        
        story.append(crear_tabla_pdf(gac_data_table, None))

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_por_gac_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_por_profesor(request):
    """Descargar PDF del informe por profesor"""
    try:
        # Obtener datos del informe por profesor
        evaluaciones = Evaluacion.objects.select_related(
            'profesor', 'estudiante', 'rac'
        ).prefetch_related('rac__materias').all()
        
        if not evaluaciones.exists():
            return JsonResponse({'error': 'No hay evaluaciones disponibles'}, status=404)
        
        # Procesar datos (mismo código que en informes_por_profesor_materia)
        profesores_data = {}
        
        for evaluacion in evaluaciones:
            try:
                profesor_id = evaluacion.profesor.id
                profesor_nombre = evaluacion.profesor.nombre
                
                materias = evaluacion.rac.materias.all()
                
                for materia in materias:
                    materia_id = materia.id
                    materia_nombre = materia.nombre
                    
                    key = f"{profesor_id}_{materia_id}"
                    
                    if key not in profesores_data:
                        profesores_data[key] = {
                            'profesor_id': profesor_id,
                            'profesor_nombre': profesor_nombre,
                            'materia_id': materia_id,
                            'materia_nombre': materia_nombre,
                            'puntajes': [],
                            'estudiantes_evaluados': set(),
                            'total_estudiantes': 0
                        }
                    
                    profesores_data[key]['puntajes'].append(evaluacion.puntaje)
                    profesores_data[key]['estudiantes_evaluados'].add(evaluacion.estudiante.id)
            except Exception as e:
                continue
        
        # Calcular total de estudiantes por materia
        for key, data in profesores_data.items():
            try:
                materia_id = data['materia_id']
                total_estudiantes = Evaluacion.objects.filter(
                    rac__materias__id=materia_id
                ).values('estudiante').distinct().count()
                data['total_estudiantes'] = total_estudiantes
            except Exception as e:
                data['total_estudiantes'] = 0
        
        # Calcular promedios y porcentajes
        resultado = []
        for data in profesores_data.values():
            if data['puntajes']:
                promedio = sum(data['puntajes']) / len(data['puntajes'])
                estudiantes_evaluados = len(data['estudiantes_evaluados'])
                total_estudiantes = data['total_estudiantes']
                
                porcentaje_evaluacion = (estudiantes_evaluados / total_estudiantes * 100) if total_estudiantes > 0 else 0
                
                if porcentaje_evaluacion <= 30:
                    color_semaforo = 'Rojo'
                elif porcentaje_evaluacion <= 60:
                    color_semaforo = 'Amarillo'
                else:
                    color_semaforo = 'Verde'
                
                resultado.append({
                    'profesor_nombre': data['profesor_nombre'],
                    'materia_nombre': data['materia_nombre'],
                    'promedio': round(promedio, 2),
                    'estudiantes_evaluados': estudiantes_evaluados,
                    'total_estudiantes': total_estudiantes,
                    'porcentaje_evaluacion': round(porcentaje_evaluacion, 1),
                    'color_semaforo': color_semaforo
                })

        # Crear PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        estilos = crear_estilos_pdf()

        # Título
        story.append(Paragraph("INFORME POR PROFESOR Y MATERIA", estilos['titulo']))
        story.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos['texto']))
        story.append(Spacer(1, 20))

        # Tabla de datos
        story.append(Paragraph("PROMEDIOS POR PROFESOR Y MATERIA", estilos['subtitulo']))
        
        profesor_data_table = [['Profesor', 'Materia', 'Promedio', 'Evaluados', 'Total', 'Progreso %', 'Estado']]
        for item in resultado:
            profesor_data_table.append([
                item['profesor_nombre'][:20] + "..." if len(item['profesor_nombre']) > 20 else item['profesor_nombre'],
                item['materia_nombre'][:25] + "..." if len(item['materia_nombre']) > 25 else item['materia_nombre'],
                str(item['promedio']),
                str(item['estudiantes_evaluados']),
                str(item['total_estudiantes']),
                f"{item['porcentaje_evaluacion']}%",
                item['color_semaforo']
            ])
        
        story.append(crear_tabla_pdf(profesor_data_table, None))

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_por_profesor_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_por_estudiante(request):
    """Descargar PDF del informe por estudiante"""
    try:
        # Obtener datos del informe por estudiante
        evaluaciones = Evaluacion.objects.select_related(
            'estudiante', 'profesor'
        ).all()
        
        # Procesar datos (mismo código que en informes_por_estudiante_profesores)
        estudiantes_data = {}
        
        for evaluacion in evaluaciones:
            estudiante_id = evaluacion.estudiante.id
            estudiante_nombre = evaluacion.estudiante.nombre
            estudiante_grupo = evaluacion.estudiante.grupo
            
            if estudiante_id not in estudiantes_data:
                estudiantes_data[estudiante_id] = {
                    'estudiante_id': estudiante_id,
                    'estudiante_nombre': estudiante_nombre,
                    'estudiante_grupo': estudiante_grupo,
                    'puntajes': [],
                    'profesores_evaluadores': set()
                }
            
            estudiantes_data[estudiante_id]['puntajes'].append(evaluacion.puntaje)
            estudiantes_data[estudiante_id]['profesores_evaluadores'].add(evaluacion.profesor.nombre)
        
        # Calcular promedios
        resultado = []
        for data in estudiantes_data.values():
            if data['puntajes']:
                promedio = sum(data['puntajes']) / len(data['puntajes'])
                
                resultado.append({
                    'estudiante_nombre': data['estudiante_nombre'],
                    'estudiante_grupo': data['estudiante_grupo'],
                    'promedio': round(promedio, 2),
                    'total_evaluaciones': len(data['puntajes']),
                    'profesores_evaluadores': list(data['profesores_evaluadores'])
                })
        
        # Ordenar por promedio descendente
        resultado.sort(key=lambda x: x['promedio'], reverse=True)

        # Crear PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        estilos = crear_estilos_pdf()

        # Título
        story.append(Paragraph("INFORME POR ESTUDIANTE", estilos['titulo']))
        story.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos['texto']))
        story.append(Spacer(1, 20))

        # Resumen estadístico
        story.append(Paragraph("RESUMEN ESTADÍSTICO", estilos['subtitulo']))
        total_estudiantes = len(resultado)
        promedio_general = sum(e['promedio'] for e in resultado) / total_estudiantes if total_estudiantes > 0 else 0
        estudiantes_aprobados = len([e for e in resultado if e['promedio'] >= 3.0])
        
        resumen_data = [
            ['Métrica', 'Valor'],
            ['Total de Estudiantes', str(total_estudiantes)],
            ['Promedio General', f"{promedio_general:.2f}"],
            ['Estudiantes Aprobados', str(estudiantes_aprobados)],
            ['Porcentaje de Aprobación', f"{(estudiantes_aprobados/total_estudiantes*100):.1f}%" if total_estudiantes > 0 else "0%"]
        ]
        story.append(crear_tabla_pdf(resumen_data, None))
        story.append(Spacer(1, 20))

        # Tabla de estudiantes (solo los primeros 50 para evitar PDFs muy largos)
        story.append(Paragraph("LISTA DE ESTUDIANTES (Top 50)", estilos['subtitulo']))
        
        estudiante_data_table = [['Estudiante', 'Grupo', 'Promedio', 'Evaluaciones', 'Profesores Evaluadores']]
        for item in resultado[:50]:  # Limitar a 50 estudiantes
            profesores_str = ', '.join(item['profesores_evaluadores'][:3])  # Máximo 3 profesores
            if len(item['profesores_evaluadores']) > 3:
                profesores_str += "..."
            
            estudiante_data_table.append([
                item['estudiante_nombre'][:25] + "..." if len(item['estudiante_nombre']) > 25 else item['estudiante_nombre'],
                item['estudiante_grupo'],
                str(item['promedio']),
                str(item['total_evaluaciones']),
                profesores_str[:30] + "..." if len(profesores_str) > 30 else profesores_str
            ])
        
        story.append(crear_tabla_pdf(estudiante_data_table, None))

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_por_estudiante_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)