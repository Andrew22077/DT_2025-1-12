from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import GAC, RAC, Materia, Evaluacion, PeriodoAcademico
from .serializers import GACSerializer, RACSerializer, MateriaSerializer, EvaluacionSerializer, EstadisticaGACSerializer, PeriodoAcademicoSerializer
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

        # Validar que el puntaje sea un valor válido
        try:
            puntaje_float = float(puntaje)
            valid_puntajes = [0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 5.0]
            if puntaje_float not in valid_puntajes:
                return Response(
                    {'error': 'El puntaje debe ser uno de los valores válidos: 0, 1, 2, 3, 3.5, 4, 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'El puntaje debe ser un número válido (0, 1, 2, 3, 3.5, 4, 5)'}, 
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
            evaluacion_existente.puntaje = puntaje_float
            evaluacion_existente.save()
            evaluacion = evaluacion_existente
        else:
            # Crear nueva evaluación
            evaluacion = Evaluacion.objects.create(
                estudiante_id=estudiante_id,
                rac_id=rac_id,
                profesor_id=profesor_id,
                puntaje=puntaje_float
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

            # Validar puntaje
            try:
                puntaje_float = float(puntaje)
                valid_puntajes = [0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 5.0]
                if puntaje_float not in valid_puntajes:
                    resultados.append({
                        'rac_id': rac_id,
                        'error': f'El puntaje debe ser uno de los valores válidos: 0, 1, 2, 3, 3.5, 4, 5 (recibido: {puntaje})'
                    })
                    continue
            except (ValueError, TypeError):
                resultados.append({
                    'rac_id': rac_id,
                    'error': f'El puntaje debe ser un número válido (0, 1, 2, 3, 3.5, 4, 5) (recibido: {puntaje})'
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
                defaults={'puntaje': puntaje_float}
            )

            if created:
                evaluaciones_creadas.append(rac_id)
            else:
                evaluaciones_actualizadas.append(rac_id)

            resultados.append({
                'rac_id': rac_id,
                'puntaje': puntaje_float,
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


def determinar_semestre_por_fecha(fecha_evaluacion, grupo_estudiante):
    """
    Determina si una evaluación pertenece al primer o segundo semestre
    basándose en la fecha y el grupo del estudiante
    """
    from datetime import datetime
    
    # Definir grupos por semestre
    primer_semestre_grupos = ['Virtual 1', '1A', '1B', '1C']
    segundo_semestre_grupos = ['2A', '2B', '2C']
    
    # Definir fechas de corte para el año académico
    # Se puede ajustar según el calendario académico de la universidad
    mes = fecha_evaluacion.month
    
    # Lógica basada en fechas
    if 1 <= mes <= 6:  # Enero a Junio = Primer Semestre
        return 'primer_semestre'
    elif 7 <= mes <= 12:  # Julio a Diciembre = Segundo Semestre
        return 'segundo_semestre'
    else:
        # Si no está en ningún rango, usar el grupo del estudiante como fallback
        if grupo_estudiante in segundo_semestre_grupos:
            return 'segundo_semestre'
        else:
            return 'primer_semestre'


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
        
        # Separar evaluaciones por semestre basándose en fechas
        evaluaciones_primer_semestre = []
        evaluaciones_segundo_semestre = []
        
        for evaluacion in evaluaciones:
            # Usar la función para determinar el semestre
            semestre = determinar_semestre_por_fecha(evaluacion.fecha, grupo_actual)
            
            if semestre == 'primer_semestre':
                evaluaciones_primer_semestre.append(evaluacion)
            else:  # segundo_semestre
                evaluaciones_segundo_semestre.append(evaluacion)
        
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
            "clasificacion": {
                "total_evaluaciones": len(evaluaciones),
                "evaluaciones_primer_semestre": len(evaluaciones_primer_semestre),
                "evaluaciones_segundo_semestre": len(evaluaciones_segundo_semestre),
                "criterio_clasificacion": "Por fecha de evaluación (Enero-Junio: 1er semestre, Julio-Diciembre: 2do semestre)"
            }
        }
        
        return JsonResponse(data, safe=False)
        
    except Estudiante.DoesNotExist:
        return JsonResponse({"error": "Estudiante no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_clasificacion_semestres(request, estudiante_id):
    """Endpoint de debug para ver cómo se clasifican las evaluaciones por semestre"""
    try:
        estudiante = Estudiante.objects.get(pk=estudiante_id)
        evaluaciones = Evaluacion.objects.filter(estudiante=estudiante).order_by('fecha')
        
        debug_info = {
            "estudiante": {
                "id": estudiante.id,
                "nombre": estudiante.nombre,
                "grupo": estudiante.grupo,
            },
            "evaluaciones_detalle": []
        }
        
        for evaluacion in evaluaciones:
            semestre = determinar_semestre_por_fecha(evaluacion.fecha, estudiante.grupo)
            debug_info["evaluaciones_detalle"].append({
                "id": evaluacion.id,
                "fecha": evaluacion.fecha.strftime("%Y-%m-%d %H:%M:%S"),
                "mes": evaluacion.fecha.month,
                "rac": evaluacion.rac.numero,
                "profesor": evaluacion.profesor.nombre,
                "puntaje": evaluacion.puntaje,
                "semestre_asignado": semestre,
                "criterio": "Por fecha" if 1 <= evaluacion.fecha.month <= 12 else "Por grupo"
            })
        
        return JsonResponse(debug_info, safe=False)
        
    except Estudiante.DoesNotExist:
        return JsonResponse({"error": "Estudiante no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_estudiantes_por_semestre(request):
    """Generar PDF de estudiantes con resultados por semestre y por GAC"""
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from django.http import HttpResponse
        from datetime import datetime
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        # Obtener todos los estudiantes
        estudiantes = Estudiante.objects.all().order_by('grupo', 'nombre')
        
        # Preparar datos para el PDF
        story = []
        
        # Título principal
        story.append(Paragraph("INFORME DE ESTUDIANTES POR SEMESTRE Y GAC", title_style))
        story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Procesar cada estudiante
        for estudiante in estudiantes:
            # Información del estudiante
            story.append(Paragraph(f"<b>ESTUDIANTE:</b> {estudiante.nombre}", heading_style))
            story.append(Paragraph(f"<b>GRUPO:</b> {estudiante.grupo} | <b>DOCUMENTO:</b> {estudiante.documento}", styles['Normal']))
            
            # Determinar si es segundo semestre
            es_segundo_semestre = estudiante.grupo in ['2A', '2B', '2C']
            
            if es_segundo_semestre:
                # Obtener resultados por semestre
                try:
                    resultados = obtener_resultados_estudiante_por_semestre_interno(estudiante.id)
                    
                    # Primer Semestre
                    if resultados['primer_semestre']['resumen_general']['total_evaluaciones'] > 0:
                        story.append(Paragraph("<b>PRIMER SEMESTRE</b>", styles['Heading3']))
                        story.append(Paragraph(f"Promedio General: {resultados['primer_semestre']['resumen_general']['promedio_general']:.2f}", styles['Normal']))
                        story.append(Paragraph(f"Total Evaluaciones: {resultados['primer_semestre']['resumen_general']['total_evaluaciones']}", styles['Normal']))
                        
                        # Tabla de GACs - Primer Semestre
                        if resultados['primer_semestre']['grafico_gacs']:
                            gac_data = [['GAC', 'Promedio', 'Estado']]
                            for gac in resultados['primer_semestre']['grafico_gacs']:
                                estado = "Excelente" if gac['promedio'] >= 4.5 else "Bueno" if gac['promedio'] >= 3.5 else "Regular" if gac['promedio'] >= 2.5 else "Deficiente"
                                gac_data.append([gac['gac'], f"{gac['promedio']:.2f}", estado])
                            
                            gac_table = Table(gac_data, colWidths=[1.5*inch, 1*inch, 1.5*inch])
                            gac_table.setStyle(TableStyle([
                                ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
                                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                ('FONTSIZE', (0, 0), (-1, 0), 10),
                                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                                ('GRID', (0, 0), (-1, -1), 1, colors.black)
                            ]))
                            story.append(gac_table)
                            story.append(Spacer(1, 12))
                    
                    # Segundo Semestre
                    if resultados['segundo_semestre']['resumen_general']['total_evaluaciones'] > 0:
                        story.append(Paragraph("<b>SEGUNDO SEMESTRE</b>", styles['Heading3']))
                        story.append(Paragraph(f"Promedio General: {resultados['segundo_semestre']['resumen_general']['promedio_general']:.2f}", styles['Normal']))
                        story.append(Paragraph(f"Total Evaluaciones: {resultados['segundo_semestre']['resumen_general']['total_evaluaciones']}", styles['Normal']))
                        
                        # Tabla de GACs - Segundo Semestre
                        if resultados['segundo_semestre']['grafico_gacs']:
                            gac_data = [['GAC', 'Promedio', 'Estado']]
                            for gac in resultados['segundo_semestre']['grafico_gacs']:
                                estado = "Excelente" if gac['promedio'] >= 4.5 else "Bueno" if gac['promedio'] >= 3.5 else "Regular" if gac['promedio'] >= 2.5 else "Deficiente"
                                gac_data.append([gac['gac'], f"{gac['promedio']:.2f}", estado])
                            
                            gac_table = Table(gac_data, colWidths=[1.5*inch, 1*inch, 1.5*inch])
                            gac_table.setStyle(TableStyle([
                                ('BACKGROUND', (0, 0), (-1, 0), colors.green),
                                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                ('FONTSIZE', (0, 0), (-1, 0), 10),
                                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                                ('GRID', (0, 0), (-1, -1), 1, colors.black)
                            ]))
                            story.append(gac_table)
                            story.append(Spacer(1, 12))
                    
                except Exception as e:
                    story.append(Paragraph(f"Error al obtener resultados: {str(e)}", styles['Normal']))
            else:
                # Para estudiantes de primer semestre, obtener resultados normales
                try:
                    evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)
                    if evaluaciones.exists():
                        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
                        total_evaluaciones = evaluaciones.count()
                        
                        story.append(Paragraph("<b>PRIMER SEMESTRE</b>", styles['Heading3']))
                        story.append(Paragraph(f"Promedio General: {promedio_general:.2f}", styles['Normal']))
                        story.append(Paragraph(f"Total Evaluaciones: {total_evaluaciones}", styles['Normal']))
                        
                        # Obtener GACs
                        gacs_data = {}
                        for evaluacion in evaluaciones:
                            for gac in evaluacion.rac.gacs.all():
                                gac_key = f"GAC {gac.numero}"
                                if gac_key not in gacs_data:
                                    gacs_data[gac_key] = []
                                gacs_data[gac_key].append(evaluacion.puntaje)
                        
                        if gacs_data:
                            gac_data = [['GAC', 'Promedio', 'Estado']]
                            for gac_key, puntajes in gacs_data.items():
                                promedio = sum(puntajes) / len(puntajes)
                                estado = "Excelente" if promedio >= 4.5 else "Bueno" if promedio >= 3.5 else "Regular" if promedio >= 2.5 else "Deficiente"
                                gac_data.append([gac_key, f"{promedio:.2f}", estado])
                            
                            gac_table = Table(gac_data, colWidths=[1.5*inch, 1*inch, 1.5*inch])
                            gac_table.setStyle(TableStyle([
                                ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
                                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                ('FONTSIZE', (0, 0), (-1, 0), 10),
                                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                                ('GRID', (0, 0), (-1, -1), 1, colors.black)
                            ]))
                            story.append(gac_table)
                            story.append(Spacer(1, 12))
                    else:
                        story.append(Paragraph("No hay evaluaciones registradas", styles['Normal']))
                        
                except Exception as e:
                    story.append(Paragraph(f"Error al obtener resultados: {str(e)}", styles['Normal']))
            
            story.append(PageBreak())
        
        # Construir PDF
        doc.build(story)
        
        # Obtener el contenido del buffer
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_estudiantes_por_semestre_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        return response
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def obtener_resultados_estudiante_por_semestre_interno(estudiante_id):
    """Función interna para obtener resultados por semestre (sin decoradores)"""
    estudiante = Estudiante.objects.get(pk=estudiante_id)
    
    # Definir grupos por semestre
    primer_semestre = ['Virtual 1', '1A', '1B', '1C']
    segundo_semestre = ['2A', '2B', '2C']
    
    # Determinar el semestre actual del estudiante
    grupo_actual = estudiante.grupo
    es_segundo_semestre = grupo_actual in segundo_semestre
    
    # Obtener todas las evaluaciones del estudiante
    evaluaciones = Evaluacion.objects.filter(estudiante=estudiante)
    
    # Separar evaluaciones por semestre basándose en fechas
    evaluaciones_primer_semestre = []
    evaluaciones_segundo_semestre = []
    
    for evaluacion in evaluaciones:
        # Usar la función para determinar el semestre
        semestre = determinar_semestre_por_fecha(evaluacion.fecha, grupo_actual)
        
        if semestre == 'primer_semestre':
            evaluaciones_primer_semestre.append(evaluacion)
        else:  # segundo_semestre
            evaluaciones_segundo_semestre.append(evaluacion)
    
    def procesar_evaluaciones_interno(evaluaciones_list, semestre_nombre):
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
        
        return {
            "semestre": semestre_nombre,
            "resumen_general": {
                "promedio_general": round(promedio_general, 2),
                "total_evaluaciones": total_evaluaciones,
                "total_gacs_evaluados": total_gacs,
                "total_racs_evaluados": total_racs,
            },
            "grafico_gacs": grafico_gacs,
        }
    
    # Procesar datos para cada semestre
    datos_primer_semestre = procesar_evaluaciones_interno(evaluaciones_primer_semestre, "Primer Semestre")
    datos_segundo_semestre = procesar_evaluaciones_interno(evaluaciones_segundo_semestre, "Segundo Semestre")
    
    # Si el estudiante está en segundo semestre, también buscar datos de primer semestre
    if es_segundo_semestre:
        try:
            estudiante_primer_semestre = Estudiante.objects.filter(
                documento=estudiante.documento,
                grupo__in=primer_semestre
            ).first()
            
            if estudiante_primer_semestre:
                evaluaciones_primer_semestre = Evaluacion.objects.filter(
                    estudiante=estudiante_primer_semestre
                )
                datos_primer_semestre = procesar_evaluaciones_interno(
                    list(evaluaciones_primer_semestre), 
                    "Primer Semestre"
                )
        except Exception as e:
            print(f"Error buscando estudiante de primer semestre: {e}")
    
    return {
        "primer_semestre": datos_primer_semestre,
        "segundo_semestre": datos_segundo_semestre,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resultados_globales(request):
    """Obtener resultados globales completos con estadísticas detalladas"""
    try:
        # Todas las evaluaciones
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'profesor', 'rac', 'periodo').prefetch_related('rac__gacs', 'rac__materias').all()

        # Promedio general
        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0

        # Totales
        total_evaluaciones = evaluaciones.count()
        total_gacs = evaluaciones.values("rac__gacs__id").distinct().count()
        total_racs = evaluaciones.values("rac__id").distinct().count()
        total_estudiantes = evaluaciones.values("estudiante").distinct().count()
        total_profesores = evaluaciones.values("profesor").distinct().count()
        total_materias = evaluaciones.values("rac__materias__id").distinct().count()

        # Definir grupos por semestre
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        # Estadísticas por semestre
        evaluaciones_primer = evaluaciones.filter(estudiante__grupo__in=primer_semestre)
        evaluaciones_segundo = evaluaciones.filter(estudiante__grupo__in=segundo_semestre)
        
        promedio_primer = evaluaciones_primer.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
        promedio_segundo = evaluaciones_segundo.aggregate(promedio=Avg("puntaje"))["promedio"] or 0

        # === Gráfico: promedio por profesor ===
        grafico_profesores_qs = (
            evaluaciones.values("profesor__nombre")
            .annotate(promedio=Avg("puntaje"))
            .order_by("-promedio")
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
            .order_by("-promedio")
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
            .order_by("-promedio")
        )
        grafico_estudiantes = [
            {"estudiante": g["estudiante__nombre"], "promedio": round(g["promedio"], 2)}
            for g in grafico_estudiantes_qs
        ]

        # === Estadísticas por GAC con semestres ===
        gacs_stats = {}
        for evaluacion in evaluaciones:
            for gac in evaluacion.rac.gacs.all():
                gac_key = f"GAC {gac.numero}"
                if gac_key not in gacs_stats:
                    gacs_stats[gac_key] = {
                        'descripcion': gac.descripcion,
                        'puntajes': [],
                        'primer_semestre': [],
                        'segundo_semestre': []
                    }
                
                gacs_stats[gac_key]['puntajes'].append(evaluacion.puntaje)
                
                if evaluacion.estudiante.grupo in primer_semestre:
                    gacs_stats[gac_key]['primer_semestre'].append(evaluacion.puntaje)
                elif evaluacion.estudiante.grupo in segundo_semestre:
                    gacs_stats[gac_key]['segundo_semestre'].append(evaluacion.puntaje)
        
        # Calcular promedios por GAC
        gacs_por_semestre = []
        for gac_key, gac_data in gacs_stats.items():
            promedio_general_gac = sum(gac_data['puntajes']) / len(gac_data['puntajes']) if gac_data['puntajes'] else 0
            promedio_primer_gac = sum(gac_data['primer_semestre']) / len(gac_data['primer_semestre']) if gac_data['primer_semestre'] else 0
            promedio_segundo_gac = sum(gac_data['segundo_semestre']) / len(gac_data['segundo_semestre']) if gac_data['segundo_semestre'] else 0
            
            gacs_por_semestre.append({
                'gac_numero': gac_key.split(' ')[1],
                'gac_descripcion': gac_data['descripcion'],
                'promedio_general': round(promedio_general_gac, 2),
                'primer_semestre': {
                    'promedio': round(promedio_primer_gac, 2),
                    'total_evaluaciones': len(gac_data['primer_semestre'])
                },
                'segundo_semestre': {
                    'promedio': round(promedio_segundo_gac, 2),
                    'total_evaluaciones': len(gac_data['segundo_semestre'])
                }
            })
        
        # Ordenar GACs por promedio general
        gacs_por_semestre.sort(key=lambda x: x['promedio_general'], reverse=True)

        # === Estadísticas por materia ===
        materias_stats = {}
        for evaluacion in evaluaciones:
            for materia in evaluacion.rac.materias.all():
                materia_key = f"{materia.id}_{materia.nombre}"
                if materia_key not in materias_stats:
                    materias_stats[materia_key] = {
                        'materia_nombre': materia.nombre,
                        'puntajes': [],
                        'primer_semestre': [],
                        'segundo_semestre': []
                    }
                
                materias_stats[materia_key]['puntajes'].append(evaluacion.puntaje)
                
                if evaluacion.estudiante.grupo in primer_semestre:
                    materias_stats[materia_key]['primer_semestre'].append(evaluacion.puntaje)
                elif evaluacion.estudiante.grupo in segundo_semestre:
                    materias_stats[materia_key]['segundo_semestre'].append(evaluacion.puntaje)
        
        # Calcular promedios por materia
        materias_por_semestre = []
        for materia_key, materia_data in materias_stats.items():
            promedio_general_materia = sum(materia_data['puntajes']) / len(materia_data['puntajes']) if materia_data['puntajes'] else 0
            promedio_primer_materia = sum(materia_data['primer_semestre']) / len(materia_data['primer_semestre']) if materia_data['primer_semestre'] else 0
            promedio_segundo_materia = sum(materia_data['segundo_semestre']) / len(materia_data['segundo_semestre']) if materia_data['segundo_semestre'] else 0
            
            materias_por_semestre.append({
                'materia_nombre': materia_data['materia_nombre'],
                'promedio_general': round(promedio_general_materia, 2),
                'primer_semestre': {
                    'promedio': round(promedio_primer_materia, 2),
                    'total_evaluaciones': len(materia_data['primer_semestre'])
                },
                'segundo_semestre': {
                    'promedio': round(promedio_segundo_materia, 2),
                    'total_evaluaciones': len(materia_data['segundo_semestre'])
                }
            })
        
        # Ordenar materias por promedio general
        materias_por_semestre.sort(key=lambda x: x['promedio_general'], reverse=True)

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
                "promedio_primer_semestre": round(promedio_primer, 2),
                "promedio_segundo_semestre": round(promedio_segundo, 2),
                "total_evaluaciones": total_evaluaciones,
                "total_evaluaciones_primer": evaluaciones_primer.count(),
                "total_evaluaciones_segundo": evaluaciones_segundo.count(),
                "total_gacs_evaluados": total_gacs,
                "total_racs_evaluados": total_racs,
                "total_estudiantes": total_estudiantes,
                "total_estudiantes_primer": evaluaciones_primer.values('estudiante').distinct().count(),
                "total_estudiantes_segundo": evaluaciones_segundo.values('estudiante').distinct().count(),
                "total_profesores": total_profesores,
                "total_materias": total_materias,
            },
            "grafico_profesores": grafico_profesores,
            "grafico_gacs": grafico_gacs,
            "grafico_estudiantes": grafico_estudiantes,
            "gacs_por_semestre": gacs_por_semestre,
            "materias_por_semestre": materias_por_semestre,
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
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'rac').prefetch_related('rac__gacs', 'rac__materias').all()
        
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
                            'primer_semestre': {'puntajes': [], 'promedio': 0, 'materias': {}},
                            'segundo_semestre': {'puntajes': [], 'promedio': 0, 'materias': {}}
                        }
                    
                    gacs_data[gac_numero][f"{semestre.lower().replace(' ', '_')}"]['puntajes'].append(evaluacion.puntaje)
                    
                    # Procesar materias para este GAC
                    for materia in evaluacion.rac.materias.all():
                        materia_key = f"{materia.id}_{materia.nombre}"
                        semestre_key = f"{semestre.lower().replace(' ', '_')}"
                        
                        if materia_key not in gacs_data[gac_numero][semestre_key]['materias']:
                            gacs_data[gac_numero][semestre_key]['materias'][materia_key] = {
                                'materia_id': materia.id,
                                'materia_nombre': materia.nombre,
                                'puntajes': []
                            }
                        
                        gacs_data[gac_numero][semestre_key]['materias'][materia_key]['puntajes'].append(evaluacion.puntaje)
                        
            except Exception as e:
                print(f"Error procesando evaluación {evaluacion.id}: {e}")
                continue
        
        # Calcular promedios
        resultado = []
        for gac_data in gacs_data.values():
            # Procesar cada semestre
            for semestre_key in ['primer_semestre', 'segundo_semestre']:
                semestre_data = gac_data[semestre_key]
                
                # Calcular promedio general del GAC
                if semestre_data['puntajes']:
                    semestre_data['promedio'] = sum(semestre_data['puntajes']) / len(semestre_data['puntajes'])
                    semestre_data['total_evaluaciones'] = len(semestre_data['puntajes'])
                else:
                    semestre_data['total_evaluaciones'] = 0
                
                # Calcular promedios por materia
                materias_resultado = []
                for materia_key, materia_data in semestre_data['materias'].items():
                    if materia_data['puntajes']:
                        materia_data['promedio'] = sum(materia_data['puntajes']) / len(materia_data['puntajes'])
                        materia_data['total_evaluaciones'] = len(materia_data['puntajes'])
                        
                        # Determinar nivel de desarrollo
                        if materia_data['promedio'] >= 4.0:
                            desarrollo = "Excelente"
                        elif materia_data['promedio'] >= 3.0:
                            desarrollo = "Bueno"
                        elif materia_data['promedio'] >= 2.0:
                            desarrollo = "Regular"
                        else:
                            desarrollo = "Deficiente"
                        
                        materias_resultado.append({
                            'materia_id': materia_data['materia_id'],
                            'materia_nombre': materia_data['materia_nombre'],
                            'promedio': round(materia_data['promedio'], 2),
                            'total_evaluaciones': materia_data['total_evaluaciones'],
                            'desarrollo': desarrollo
                        })
                    else:
                        materia_data['total_evaluaciones'] = 0
                
                # Ordenar materias por promedio descendente
                materias_resultado.sort(key=lambda x: x['promedio'], reverse=True)
                semestre_data['materias'] = materias_resultado
                
                # Limpiar datos de puntajes
                del semestre_data['puntajes']
            
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
        
        # Calcular promedios por estudiante y por GAC
        resultado = []
        for data in estudiantes_data.values():
            puntajes = [eval['puntaje'] for eval in data['evaluaciones']]
            promedio = sum(puntajes) / len(puntajes) if puntajes else 0
            
            # Calcular promedios por GAC
            gacs_data = {}
            for evaluacion_data in data['evaluaciones']:
                # Obtener los GACs de esta evaluación
                try:
                    evaluacion_obj = Evaluacion.objects.get(
                        profesor=profesor,
                        estudiante_id=data['estudiante_id'],
                        rac__numero=evaluacion_data['rac_numero'],
                        fecha=evaluacion_data['fecha']
                    )
                    for gac in evaluacion_obj.rac.gacs.all():
                        gac_key = f"GAC {gac.numero}"
                        if gac_key not in gacs_data:
                            gacs_data[gac_key] = {
                                'gac': gac_key,
                                'descripcion': gac.descripcion,
                                'puntajes': []
                            }
                        gacs_data[gac_key]['puntajes'].append(evaluacion_data['puntaje'])
                except Evaluacion.DoesNotExist:
                    continue
            
            # Calcular promedios por GAC
            gacs_promedio = []
            for gac_data in gacs_data.values():
                if gac_data['puntajes']:
                    promedio_gac = sum(gac_data['puntajes']) / len(gac_data['puntajes'])
                    gacs_promedio.append({
                        'gac': gac_data['gac'],
                        'descripcion': gac_data['descripcion'],
                        'promedio': round(promedio_gac, 2),
                        'total_evaluaciones': len(gac_data['puntajes'])
                    })
            
            resultado.append({
                'estudiante_id': data['estudiante_id'],
                'estudiante_nombre': data['estudiante_nombre'],
                'estudiante_grupo': data['estudiante_grupo'],
                'promedio': round(promedio, 2),
                'total_evaluaciones': len(data['evaluaciones']),
                'evaluaciones': data['evaluaciones'],
                'gacs': gacs_promedio
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
        evaluaciones_ejemplo = list(Evaluacion.objects.select_related('estudiante', 'profesor', 'rac').prefetch_related('rac__gacs').values(
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
    """Descargar PDF del resumen general completo"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from django.http import HttpResponse
        from datetime import datetime
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Estilos personalizados con colores
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkgreen,
            fontName='Helvetica-Bold'
        )
        
        section_style = ParagraphStyle(
            'CustomSection',
            parent=styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.darkred,
            fontName='Helvetica-Bold'
        )
        
        # Obtener datos del resumen general
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'profesor', 'rac').prefetch_related('rac__gacs', 'rac__materias').all()
        
        # Estadísticas básicas
        promedio_general = evaluaciones.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
        total_evaluaciones = evaluaciones.count()
        total_estudiantes = evaluaciones.values("estudiante").distinct().count()
        total_profesores = evaluaciones.values("profesor").distinct().count()
        total_gacs = evaluaciones.values("rac__gacs__id").distinct().count()
        total_materias = evaluaciones.values("rac__materias__id").distinct().count()
        
        # Definir grupos por semestre
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        # Estadísticas por semestre
        evaluaciones_primer = evaluaciones.filter(estudiante__grupo__in=primer_semestre)
        evaluaciones_segundo = evaluaciones.filter(estudiante__grupo__in=segundo_semestre)
        
        promedio_primer = evaluaciones_primer.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
        promedio_segundo = evaluaciones_segundo.aggregate(promedio=Avg("puntaje"))["promedio"] or 0
        
        # Estadísticas por GAC
        gacs_stats = {}
        for evaluacion in evaluaciones:
            for gac in evaluacion.rac.gacs.all():
                gac_key = f"GAC {gac.numero}"
                if gac_key not in gacs_stats:
                    gacs_stats[gac_key] = {
                        'descripcion': gac.descripcion,
                        'puntajes': [],
                        'primer_semestre': [],
                        'segundo_semestre': []
                    }
                
                gacs_stats[gac_key]['puntajes'].append(evaluacion.puntaje)
                
                if evaluacion.estudiante.grupo in primer_semestre:
                    gacs_stats[gac_key]['primer_semestre'].append(evaluacion.puntaje)
                elif evaluacion.estudiante.grupo in segundo_semestre:
                    gacs_stats[gac_key]['segundo_semestre'].append(evaluacion.puntaje)
        
        # Calcular promedios por GAC
        gacs_resultado = []
        for gac_key, gac_data in gacs_stats.items():
            promedio_general_gac = sum(gac_data['puntajes']) / len(gac_data['puntajes']) if gac_data['puntajes'] else 0
            promedio_primer_gac = sum(gac_data['primer_semestre']) / len(gac_data['primer_semestre']) if gac_data['primer_semestre'] else 0
            promedio_segundo_gac = sum(gac_data['segundo_semestre']) / len(gac_data['segundo_semestre']) if gac_data['segundo_semestre'] else 0
            
            gacs_resultado.append({
                'gac': gac_key,
                'descripcion': gac_data['descripcion'],
                'promedio_general': round(promedio_general_gac, 2),
                'promedio_primer': round(promedio_primer_gac, 2),
                'promedio_segundo': round(promedio_segundo_gac, 2),
                'total_evaluaciones': len(gac_data['puntajes']),
                'evaluaciones_primer': len(gac_data['primer_semestre']),
                'evaluaciones_segundo': len(gac_data['segundo_semestre'])
            })
        
        # Ordenar GACs por promedio general
        gacs_resultado.sort(key=lambda x: x['promedio_general'], reverse=True)
        
        # Estadísticas por materia
        materias_stats = {}
        for evaluacion in evaluaciones:
            for materia in evaluacion.rac.materias.all():
                materia_key = f"{materia.id}_{materia.nombre}"
                if materia_key not in materias_stats:
                    materias_stats[materia_key] = {
                        'materia_nombre': materia.nombre,
                        'puntajes': [],
                        'primer_semestre': [],
                        'segundo_semestre': []
                    }
                
                materias_stats[materia_key]['puntajes'].append(evaluacion.puntaje)
                
                if evaluacion.estudiante.grupo in primer_semestre:
                    materias_stats[materia_key]['primer_semestre'].append(evaluacion.puntaje)
                elif evaluacion.estudiante.grupo in segundo_semestre:
                    materias_stats[materia_key]['segundo_semestre'].append(evaluacion.puntaje)
        
        # Calcular promedios por materia
        materias_resultado = []
        for materia_key, materia_data in materias_stats.items():
            promedio_general_materia = sum(materia_data['puntajes']) / len(materia_data['puntajes']) if materia_data['puntajes'] else 0
            promedio_primer_materia = sum(materia_data['primer_semestre']) / len(materia_data['primer_semestre']) if materia_data['primer_semestre'] else 0
            promedio_segundo_materia = sum(materia_data['segundo_semestre']) / len(materia_data['segundo_semestre']) if materia_data['segundo_semestre'] else 0
            
            materias_resultado.append({
                'materia_nombre': materia_data['materia_nombre'],
                'promedio_general': round(promedio_general_materia, 2),
                'promedio_primer': round(promedio_primer_materia, 2),
                'promedio_segundo': round(promedio_segundo_materia, 2),
                'total_evaluaciones': len(materia_data['puntajes']),
                'evaluaciones_primer': len(materia_data['primer_semestre']),
                'evaluaciones_segundo': len(materia_data['segundo_semestre'])
            })
        
        # Ordenar materias por promedio general
        materias_resultado.sort(key=lambda x: x['promedio_general'], reverse=True)
        
        # Estadísticas por profesor
        profesores_stats = {}
        for evaluacion in evaluaciones:
            profesor_key = f"{evaluacion.profesor.id}_{evaluacion.profesor.nombre}"
            if profesor_key not in profesores_stats:
                profesores_stats[profesor_key] = {
                    'profesor_nombre': evaluacion.profesor.nombre,
                    'puntajes': [],
                    'primer_semestre': [],
                    'segundo_semestre': []
                }
            
            profesores_stats[profesor_key]['puntajes'].append(evaluacion.puntaje)
            
            if evaluacion.estudiante.grupo in primer_semestre:
                profesores_stats[profesor_key]['primer_semestre'].append(evaluacion.puntaje)
            elif evaluacion.estudiante.grupo in segundo_semestre:
                profesores_stats[profesor_key]['segundo_semestre'].append(evaluacion.puntaje)
        
        # Calcular promedios por profesor
        profesores_resultado = []
        for profesor_key, profesor_data in profesores_stats.items():
            promedio_general_profesor = sum(profesor_data['puntajes']) / len(profesor_data['puntajes']) if profesor_data['puntajes'] else 0
            promedio_primer_profesor = sum(profesor_data['primer_semestre']) / len(profesor_data['primer_semestre']) if profesor_data['primer_semestre'] else 0
            promedio_segundo_profesor = sum(profesor_data['segundo_semestre']) / len(profesor_data['segundo_semestre']) if profesor_data['segundo_semestre'] else 0
            
            profesores_resultado.append({
                'profesor_nombre': profesor_data['profesor_nombre'],
                'promedio_general': round(promedio_general_profesor, 2),
                'promedio_primer': round(promedio_primer_profesor, 2),
                'promedio_segundo': round(promedio_segundo_profesor, 2),
                'total_evaluaciones': len(profesor_data['puntajes']),
                'evaluaciones_primer': len(profesor_data['primer_semestre']),
                'evaluaciones_segundo': len(profesor_data['segundo_semestre'])
            })
        
        # Ordenar profesores por promedio general
        profesores_resultado.sort(key=lambda x: x['promedio_general'], reverse=True)
        
        # Preparar datos para el PDF
        story = []
        
        # Título principal
        story.append(Paragraph("📊 INFORME GENERAL COMPLETO", title_style))
        story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))

        # Resumen general con estadísticas básicas
        story.append(Paragraph("📈 RESUMEN GENERAL", subtitle_style))
        
        resumen_table = [['Métrica', 'Valor', 'Primer Semestre', 'Segundo Semestre']]
        resumen_table.append([
            'Total Evaluaciones',
            str(total_evaluaciones),
            str(evaluaciones_primer.count()),
            str(evaluaciones_segundo.count())
        ])
        resumen_table.append([
            'Total Estudiantes',
            str(total_estudiantes),
            str(evaluaciones_primer.values('estudiante').distinct().count()),
            str(evaluaciones_segundo.values('estudiante').distinct().count())
        ])
        resumen_table.append([
            'Total Profesores',
            str(total_profesores),
            str(evaluaciones_primer.values('profesor').distinct().count()),
            str(evaluaciones_segundo.values('profesor').distinct().count())
        ])
        resumen_table.append([
            'Total GACs',
            str(total_gacs),
            '-',
            '-'
        ])
        resumen_table.append([
            'Total Materias',
            str(total_materias),
            '-',
            '-'
        ])
        resumen_table.append([
            'Promedio General',
            f"{promedio_general:.2f}",
            f"{promedio_primer:.2f}",
            f"{promedio_segundo:.2f}"
        ])
        
        # Crear tabla resumen con colores
        resumen_table_obj = Table(resumen_table, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
        resumen_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Colores específicos
            ('BACKGROUND', (2, 1), (2, -1), colors.lightblue),  # Primer semestre
            ('BACKGROUND', (3, 1), (3, -1), colors.lightgreen),  # Segundo semestre
        ]))
        
        story.append(resumen_table_obj)
        story.append(Spacer(1, 20))

        # Top GACs con mejor rendimiento
        story.append(Paragraph("🎯 TOP GACs CON MEJOR RENDIMIENTO", subtitle_style))
        
        gac_table = [['GAC', 'Descripción', 'Promedio General', '1er Semestre', '2do Semestre', 'Total Evaluaciones']]
        for gac in gacs_resultado[:10]:  # Top 10 GACs
            gac_table.append([
                gac['gac'],
                gac['descripcion'][:30] + "..." if len(gac['descripcion']) > 30 else gac['descripcion'],
                f"{gac['promedio_general']:.2f}",
                f"{gac['promedio_primer']:.2f}",
                f"{gac['promedio_segundo']:.2f}",
                str(gac['total_evaluaciones'])
            ])
        
        gac_table_obj = Table(gac_table, colWidths=[0.8*inch, 2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        gac_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(gac_table_obj)
        story.append(Spacer(1, 20))

        # Top Materias con mejor rendimiento
        story.append(Paragraph("📚 TOP MATERIAS CON MEJOR RENDIMIENTO", subtitle_style))
        
        materia_table = [['Materia', 'Promedio General', '1er Semestre', '2do Semestre', 'Total Evaluaciones']]
        for materia in materias_resultado[:10]:  # Top 10 materias
            materia_table.append([
                materia['materia_nombre'][:40] + "..." if len(materia['materia_nombre']) > 40 else materia['materia_nombre'],
                f"{materia['promedio_general']:.2f}",
                f"{materia['promedio_primer']:.2f}",
                f"{materia['promedio_segundo']:.2f}",
                str(materia['total_evaluaciones'])
            ])
        
        materia_table_obj = Table(materia_table, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        materia_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkred),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightcoral),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(materia_table_obj)
        story.append(Spacer(1, 20))

        # Top Profesores con mejor rendimiento
        story.append(Paragraph("👨‍🏫 TOP PROFESORES CON MEJOR RENDIMIENTO", subtitle_style))
        
        profesor_table = [['Profesor', 'Promedio General', '1er Semestre', '2do Semestre', 'Total Evaluaciones']]
        for profesor in profesores_resultado[:10]:  # Top 10 profesores
            profesor_table.append([
                profesor['profesor_nombre'][:30] + "..." if len(profesor['profesor_nombre']) > 30 else profesor['profesor_nombre'],
                f"{profesor['promedio_general']:.2f}",
                f"{profesor['promedio_primer']:.2f}",
                f"{profesor['promedio_segundo']:.2f}",
                str(profesor['total_evaluaciones'])
            ])
        
        profesor_table_obj = Table(profesor_table, colWidths=[2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        profesor_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkorange),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(profesor_table_obj)
        story.append(Spacer(1, 20))

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_general_completo_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_por_gac(request):
    """Descargar PDF del informe por GAC con colores y análisis por materia"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from django.http import HttpResponse
        from datetime import datetime
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Estilos personalizados con colores
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkgreen,
            fontName='Helvetica-Bold'
        )
        
        section_style = ParagraphStyle(
            'CustomSection',
            parent=styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.darkred,
            fontName='Helvetica-Bold'
        )
        
        # Obtener datos del informe por GAC
        primer_semestre = ['Virtual 1', '1A', '1B', '1C']
        segundo_semestre = ['2A', '2B', '2C']
        
        evaluaciones = Evaluacion.objects.select_related('estudiante', 'rac').prefetch_related('rac__gacs', 'rac__materias').all()
        
        if not evaluaciones.exists():
            return JsonResponse({'error': 'No hay evaluaciones disponibles'}, status=404)
        
        # Procesar datos con información de materias
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
                            'primer_semestre': {'puntajes': [], 'promedio': 0, 'materias': {}},
                            'segundo_semestre': {'puntajes': [], 'promedio': 0, 'materias': {}}
                        }
                    
                    # Agregar puntaje al semestre correspondiente
                    gacs_data[gac_numero][f"{semestre.lower().replace(' ', '_')}"]['puntajes'].append(evaluacion.puntaje)
                    
                    # Procesar materias para este GAC
                    for materia in evaluacion.rac.materias.all():
                        materia_key = f"{materia.id}_{materia.nombre}"
                        semestre_key = f"{semestre.lower().replace(' ', '_')}"
                        
                        if materia_key not in gacs_data[gac_numero][semestre_key]['materias']:
                            gacs_data[gac_numero][semestre_key]['materias'][materia_key] = {
                                'materia_id': materia.id,
                                'materia_nombre': materia.nombre,
                                'puntajes': []
                            }
                        
                        gacs_data[gac_numero][semestre_key]['materias'][materia_key]['puntajes'].append(evaluacion.puntaje)
                        
            except Exception as e:
                continue
        
        # Calcular promedios por GAC y por materia
        for gac_data in gacs_data.values():
            for semestre_key in ['primer_semestre', 'segundo_semestre']:
                semestre_data = gac_data[semestre_key]
                
                # Calcular promedio general del GAC
                if semestre_data['puntajes']:
                    semestre_data['promedio'] = sum(semestre_data['puntajes']) / len(semestre_data['puntajes'])
                    semestre_data['total_evaluaciones'] = len(semestre_data['puntajes'])
                else:
                    semestre_data['total_evaluaciones'] = 0
                
                # Calcular promedios por materia
                for materia_key, materia_data in semestre_data['materias'].items():
                    if materia_data['puntajes']:
                        materia_data['promedio'] = sum(materia_data['puntajes']) / len(materia_data['puntajes'])
                        materia_data['total_evaluaciones'] = len(materia_data['puntajes'])
                    else:
                        materia_data['total_evaluaciones'] = 0

        # Preparar datos para el PDF
        story = []
        
        # Título principal
        story.append(Paragraph("🎯 INFORME POR GAC Y MATERIAS", title_style))
        story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))

        # Resumen general por GAC
        story.append(Paragraph("📊 RESUMEN GENERAL POR GAC", subtitle_style))
        
        resumen_table = [['GAC', 'Descripción', '1er Semestre', 'Evaluaciones 1er', '2do Semestre', 'Evaluaciones 2do']]
        for gac_data in sorted(gacs_data.values(), key=lambda x: x['gac_numero']):
            resumen_table.append([
                f"GAC {gac_data['gac_numero']}",
                gac_data['gac_descripcion'][:30] + "..." if len(gac_data['gac_descripcion']) > 30 else gac_data['gac_descripcion'],
                f"{gac_data['primer_semestre']['promedio']:.2f}",
                str(gac_data['primer_semestre']['total_evaluaciones']),
                f"{gac_data['segundo_semestre']['promedio']:.2f}",
                str(gac_data['segundo_semestre']['total_evaluaciones'])
            ])
        
        # Crear tabla resumen con colores
        resumen_table_obj = Table(resumen_table, colWidths=[1*inch, 2*inch, 1*inch, 1*inch, 1*inch, 1*inch])
        resumen_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            # Filas de datos
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Colores específicos
            ('BACKGROUND', (2, 1), (2, -1), colors.lightblue),  # 1er semestre
            ('BACKGROUND', (4, 1), (4, -1), colors.lightgreen),  # 2do semestre
        ]))
        
        story.append(resumen_table_obj)
        story.append(Spacer(1, 20))

        # Detalles por GAC con análisis de materias
        story.append(Paragraph("🔍 ANÁLISIS DETALLADO POR GAC Y MATERIA", subtitle_style))
        
        for gac_data in sorted(gacs_data.values(), key=lambda x: x['gac_numero']):
            # Información del GAC
            story.append(Paragraph(f"<b>🎯 GAC {gac_data['gac_numero']}:</b> {gac_data['gac_descripcion']}", section_style))
            
            # Primer Semestre
            if gac_data['primer_semestre']['total_evaluaciones'] > 0:
                story.append(Paragraph(f"<b>📚 PRIMER SEMESTRE - Promedio General: {gac_data['primer_semestre']['promedio']:.2f}</b>", styles['Heading4']))
                
                # Tabla de materias - Primer Semestre
                if gac_data['primer_semestre']['materias']:
                    materias_table = [['Materia', 'Promedio', 'Evaluaciones', 'Desarrollo']]
                    
                    # Ordenar materias por promedio descendente
                    materias_ordenadas = sorted(
                        gac_data['primer_semestre']['materias'].values(),
                        key=lambda x: x['promedio'],
                        reverse=True
                    )
                    
                    for i, materia in enumerate(materias_ordenadas):
                        if materia['total_evaluaciones'] > 0:
                            # Determinar nivel de desarrollo
                            if materia['promedio'] >= 4.0:
                                desarrollo = "Excelente"
                                color_fondo = colors.lightgreen
                            elif materia['promedio'] >= 3.0:
                                desarrollo = "Bueno"
                                color_fondo = colors.lightyellow
                            elif materia['promedio'] >= 2.0:
                                desarrollo = "Regular"
                                color_fondo = colors.lightcoral
                            else:
                                desarrollo = "Deficiente"
                                color_fondo = colors.lightcoral
                            
                            materias_table.append([
                                materia['materia_nombre'][:25] + "..." if len(materia['materia_nombre']) > 25 else materia['materia_nombre'],
                                f"{materia['promedio']:.2f}",
                                str(materia['total_evaluaciones']),
                                desarrollo
                            ])
                    
                    if len(materias_table) > 1:  # Si hay datos además del header
                        materias_table_obj = Table(materias_table, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
                        materias_table_obj.setStyle(TableStyle([
                            # Header
                            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 9),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                            # Filas de datos
                            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                            ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ]))
                        
                        story.append(materias_table_obj)
                        story.append(Spacer(1, 10))
            
            # Segundo Semestre
            if gac_data['segundo_semestre']['total_evaluaciones'] > 0:
                story.append(Paragraph(f"<b>📚 SEGUNDO SEMESTRE - Promedio General: {gac_data['segundo_semestre']['promedio']:.2f}</b>", styles['Heading4']))
                
                # Tabla de materias - Segundo Semestre
                if gac_data['segundo_semestre']['materias']:
                    materias_table = [['Materia', 'Promedio', 'Evaluaciones', 'Desarrollo']]
                    
                    # Ordenar materias por promedio descendente
                    materias_ordenadas = sorted(
                        gac_data['segundo_semestre']['materias'].values(),
                        key=lambda x: x['promedio'],
                        reverse=True
                    )
                    
                    for i, materia in enumerate(materias_ordenadas):
                        if materia['total_evaluaciones'] > 0:
                            # Determinar nivel de desarrollo
                            if materia['promedio'] >= 4.0:
                                desarrollo = "Excelente"
                                color_fondo = colors.lightgreen
                            elif materia['promedio'] >= 3.0:
                                desarrollo = "Bueno"
                                color_fondo = colors.lightyellow
                            elif materia['promedio'] >= 2.0:
                                desarrollo = "Regular"
                                color_fondo = colors.lightcoral
                            else:
                                desarrollo = "Deficiente"
                                color_fondo = colors.lightcoral
                            
                            materias_table.append([
                                materia['materia_nombre'][:25] + "..." if len(materia['materia_nombre']) > 25 else materia['materia_nombre'],
                                f"{materia['promedio']:.2f}",
                                str(materia['total_evaluaciones']),
                                desarrollo
                            ])
                    
                    if len(materias_table) > 1:  # Si hay datos además del header
                        materias_table_obj = Table(materias_table, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
                        materias_table_obj.setStyle(TableStyle([
                            # Header
                            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 9),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                            # Filas de datos
                            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                            ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ]))
                        
                        story.append(materias_table_obj)
                        story.append(Spacer(1, 10))
            
            story.append(Spacer(1, 15))
            
            # Salto de página cada 2 GACs
            if (list(gacs_data.keys()).index(gac_data['gac_numero']) + 1) % 2 == 0:
                story.append(PageBreak())

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_gac_detallado_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_por_profesor(request):
    """Descargar PDF del informe por profesor con colores y resultados por GAC"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from django.http import HttpResponse
        from datetime import datetime
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Estilos personalizados con colores
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkgreen,
            fontName='Helvetica-Bold'
        )
        
        section_style = ParagraphStyle(
            'CustomSection',
            parent=styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.darkred,
            fontName='Helvetica-Bold'
        )
        
        # Obtener datos del informe por profesor
        evaluaciones = Evaluacion.objects.select_related(
            'profesor', 'estudiante', 'rac'
        ).prefetch_related('rac__materias', 'rac__gacs').all()
        
        if not evaluaciones.exists():
            return JsonResponse({'error': 'No hay evaluaciones disponibles'}, status=404)
        
        # Procesar datos por profesor-materia
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
                            'total_estudiantes': 0,
                            'gacs_data': {}
                        }
                    
                    profesores_data[key]['puntajes'].append(evaluacion.puntaje)
                    profesores_data[key]['estudiantes_evaluados'].add(evaluacion.estudiante.id)
                    
                    # Procesar GACs
                    for gac in evaluacion.rac.gacs.all():
                        gac_key = f"GAC {gac.numero}"
                        if gac_key not in profesores_data[key]['gacs_data']:
                            profesores_data[key]['gacs_data'][gac_key] = {
                                'gac': gac_key,
                                'descripcion': gac.descripcion,
                                'puntajes': []
                            }
                        profesores_data[key]['gacs_data'][gac_key]['puntajes'].append(evaluacion.puntaje)
                        
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
                
                # Calcular promedios por GAC
                gacs_promedio = []
                for gac_data in data['gacs_data'].values():
                    if gac_data['puntajes']:
                        promedio_gac = sum(gac_data['puntajes']) / len(gac_data['puntajes'])
                        gacs_promedio.append({
                            'gac': gac_data['gac'],
                            'descripcion': gac_data['descripcion'],
                            'promedio': round(promedio_gac, 2),
                            'total_evaluaciones': len(gac_data['puntajes'])
                        })
                
                resultado.append({
                    'profesor_nombre': data['profesor_nombre'],
                    'materia_nombre': data['materia_nombre'],
                    'promedio': round(promedio, 2),
                    'estudiantes_evaluados': estudiantes_evaluados,
                    'total_estudiantes': total_estudiantes,
                    'porcentaje_evaluacion': round(porcentaje_evaluacion, 1),
                    'color_semaforo': color_semaforo,
                    'gacs': gacs_promedio
                })

        # Preparar datos para el PDF
        story = []
        
        # Título principal
        story.append(Paragraph("📊 INFORME POR PROFESOR Y MATERIA", title_style))
        story.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))

        # Tabla resumen con colores
        story.append(Paragraph("📈 RESUMEN GENERAL", subtitle_style))
        
        resumen_table = [['Profesor', 'Materia', 'Promedio', 'Evaluados', 'Total', 'Progreso %', 'Estado']]
        for item in resultado:
            # Determinar color de fondo según el promedio
            if item['promedio'] >= 4.0:
                color_fondo = colors.lightgreen
            elif item['promedio'] >= 3.0:
                color_fondo = colors.lightyellow
            else:
                color_fondo = colors.lightcoral
            
            resumen_table.append([
                item['profesor_nombre'][:20] + "..." if len(item['profesor_nombre']) > 20 else item['profesor_nombre'],
                item['materia_nombre'][:25] + "..." if len(item['materia_nombre']) > 25 else item['materia_nombre'],
                str(item['promedio']),
                str(item['estudiantes_evaluados']),
                str(item['total_estudiantes']),
                f"{item['porcentaje_evaluacion']}%",
                item['color_semaforo']
            ])
        
        # Crear tabla con estilos de colores
        resumen_table_obj = Table(resumen_table, colWidths=[1.5*inch, 1.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1*inch])
        resumen_table_obj.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            # Filas de datos con colores alternados
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Colores específicos por promedio
            ('BACKGROUND', (2, 1), (2, -1), colors.lightblue),  # Columna promedio
        ]))
        
        story.append(resumen_table_obj)
        story.append(Spacer(1, 20))

        # Detalles por profesor-materia con GACs
        story.append(Paragraph("🎯 DETALLES POR PROFESOR Y MATERIA", subtitle_style))
        
        for item in resultado:
            # Información del profesor-materia
            story.append(Paragraph(f"<b>👨‍🏫 PROFESOR:</b> {item['profesor_nombre']}", section_style))
            story.append(Paragraph(f"<b>📚 MATERIA:</b> {item['materia_nombre']}", styles['Normal']))
            story.append(Paragraph(f"<b>📊 PROMEDIO GENERAL:</b> {item['promedio']} | <b>ESTUDIANTES EVALUADOS:</b> {item['estudiantes_evaluados']}/{item['total_estudiantes']} ({item['porcentaje_evaluacion']}%)", styles['Normal']))
            
            # Tabla de GACs si existen
            if item['gacs']:
                story.append(Paragraph("<b>🎯 RESULTADOS POR GAC:</b>", styles['Heading4']))
                
                gac_table_data = [['GAC', 'Descripción', 'Promedio', 'Evaluaciones']]
                for gac in item['gacs']:
                    gac_table_data.append([
                        gac['gac'],
                        gac['descripcion'][:40] + "..." if len(gac['descripcion']) > 40 else gac['descripcion'],
                        str(gac['promedio']),
                        str(gac['total_evaluaciones'])
                    ])
                
                gac_table = Table(gac_table_data, colWidths=[1*inch, 2.5*inch, 1*inch, 1*inch])
                gac_table.setStyle(TableStyle([
                    # Header
                    ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    # Filas de datos
                    ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                ]))
                
                story.append(gac_table)
            else:
                story.append(Paragraph("<i>No hay datos de GAC disponibles para esta materia.</i>", styles['Normal']))
            
            story.append(Spacer(1, 15))
            
            # Salto de página cada 3 profesores
            if (resultado.index(item) + 1) % 3 == 0:
                story.append(PageBreak())

        # Construir PDF
        doc.build(story)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="informe_profesores_detallado_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def descargar_pdf_estudiante_individual(request, estudiante_id):
    """Descargar PDF detallado de un estudiante específico"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from io import BytesIO
        from django.http import HttpResponse
        from datetime import datetime
        
        print(f"=== DEBUG PDF INDIVIDUAL ===")
        print(f"Estudiante ID solicitado: {estudiante_id}")
        print(f"Usuario autenticado: {request.user}")
        
        # Obtener el estudiante
        try:
            estudiante = Estudiante.objects.get(id=estudiante_id)
            print(f"Estudiante encontrado: {estudiante.nombre}")
        except Estudiante.DoesNotExist:
            print(f"Error: Estudiante con ID {estudiante_id} no encontrado")
            return Response({'error': 'Estudiante no encontrado'}, status=404)
        
        # Obtener evaluaciones del estudiante
        print("Obteniendo evaluaciones del estudiante...")
        evaluaciones = Evaluacion.objects.filter(
            estudiante=estudiante
        ).select_related('profesor', 'rac').prefetch_related('rac__gacs')
        
        print(f"Total de evaluaciones encontradas: {evaluaciones.count()}")
        
        if not evaluaciones.exists():
            print("No hay evaluaciones para este estudiante")
            return Response({'error': 'No hay evaluaciones para este estudiante'}, status=404)
        
        # Procesar datos por GAC y RAC
        print("Procesando datos por GAC y RAC...")
        gacs_data = {}
        rac_data = []
        
        for evaluacion in evaluaciones:
            # Datos por GAC
            for gac in evaluacion.rac.gacs.all():
                if gac.numero not in gacs_data:
                    gacs_data[gac.numero] = {
                        'descripcion': gac.descripcion,
                        'evaluaciones': [],
                        'promedio': 0
                    }
                gacs_data[gac.numero]['evaluaciones'].append(evaluacion.puntaje)
            
            # Datos por RAC
            rac_data.append({
                'numero': evaluacion.rac.numero,
                'descripcion': evaluacion.rac.descripcion,
                'puntaje': evaluacion.puntaje,
                'profesor': evaluacion.profesor.nombre,
                'gacs': [gac.numero for gac in evaluacion.rac.gacs.all()]
            })
        
        # Calcular promedios por GAC
        print("Calculando promedios por GAC...")
        for gac_num, data in gacs_data.items():
            if data['evaluaciones']:
                data['promedio'] = round(sum(data['evaluaciones']) / len(data['evaluaciones']), 2)
        
        # Calcular promedio general
        todos_puntajes = [eval.puntaje for eval in evaluaciones]
        promedio_general = round(sum(todos_puntajes) / len(todos_puntajes), 2)
        print(f"Promedio general calculado: {promedio_general}")
        
        # Crear PDF detallado
        print("Creando PDF detallado...")
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        # Obtener estilos personalizados
        print("Obteniendo estilos PDF...")
        estilos = crear_estilos_pdf()
        
        # Título principal
        titulo = Paragraph(f"📊 Reporte de Resultados - {estudiante.nombre}", estilos['titulo'])
        story.append(titulo)
        story.append(Spacer(1, 20))
        
        # Información del estudiante con colores
        info_estudiante = [
            ["👤 Estudiante:", estudiante.nombre],
            ["🏫 Grupo:", estudiante.grupo],
            ["🆔 Documento:", estudiante.documento],
            ["📝 Total Evaluaciones:", str(len(evaluaciones))],
            ["⭐ Promedio General:", f"{promedio_general}/5.0"]
        ]
        
        tabla_info = Table(info_estudiante, colWidths=[2.2*inch, 2.8*inch])
        tabla_info.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.lightgrey, colors.white]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        story.append(tabla_info)
        story.append(Spacer(1, 20))
        
        # Resultados por GAC con colores
        if gacs_data:
            print("Agregando resultados por GAC...")
            story.append(Paragraph("🎯 Resultados por GAC (Grupo de Área de Conocimiento)", estilos['subtitulo']))
            story.append(Spacer(1, 10))
            
            gac_table_data = [["GAC", "Descripción", "Promedio", "Evaluaciones"]]
            for gac_num, data in sorted(gacs_data.items()):
                # Truncar descripción si es muy larga, manteniendo palabras completas
                descripcion = data['descripcion']
                if len(descripcion) > 45:
                    descripcion = descripcion[:45]
                    # Buscar el último espacio para no cortar palabras
                    ultimo_espacio = descripcion.rfind(' ')
                    if ultimo_espacio > 30:  # Solo si no es muy corto
                        descripcion = descripcion[:ultimo_espacio]
                    descripcion += "..."
                
                gac_table_data.append([
                    f"GAC {gac_num}",
                    descripcion,
                    f"{data['promedio']}/5.0",
                    str(len(data['evaluaciones']))
                ])
            
            gac_table = Table(gac_table_data, colWidths=[0.7*inch, 3.5*inch, 0.7*inch, 0.7*inch])
            gac_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),  # Alineación izquierda para descripción
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))
            story.append(gac_table)
            story.append(Spacer(1, 20))
        
        # Evaluaciones detalladas por RAC con colores
        if rac_data:
            print("Agregando evaluaciones detalladas por RAC...")
            story.append(Paragraph("📋 Evaluaciones Detalladas por RAC (Resultado de Aprendizaje Clave)", estilos['subtitulo']))
            story.append(Spacer(1, 10))
            
            rac_table_data = [["RAC", "Descripción", "Profesor", "Puntaje", "GACs"]]
            for rac in rac_data:
                # Truncar descripción si es muy larga, manteniendo palabras completas
                descripcion = rac['descripcion']
                if len(descripcion) > 60:
                    descripcion = descripcion[:60]
                    # Buscar el último espacio para no cortar palabras
                    ultimo_espacio = descripcion.rfind(' ')
                    if ultimo_espacio > 40:  # Solo si no es muy corto
                        descripcion = descripcion[:ultimo_espacio]
                    descripcion += "..."
                rac_table_data.append([
                    f"RAC {rac['numero']}",
                    descripcion,
                    rac['profesor'],
                    f"{rac['puntaje']}/5",
                    ", ".join([f"GAC {gac}" for gac in rac['gacs']])
                ])
            
            rac_table = Table(rac_table_data, colWidths=[0.7*inch, 2.8*inch, 1.2*inch, 0.7*inch, 1.1*inch])
            rac_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),  # Alineación izquierda para descripción
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            story.append(rac_table)
        
        # Resumen con colores
        print("Agregando resumen final...")
        story.append(Spacer(1, 20))
        story.append(Paragraph("📈 Resumen Ejecutivo", estilos['subtitulo']))
        
        # Determinar color del promedio general
        color_promedio = colors.green if promedio_general >= 4.0 else \
                        colors.blue if promedio_general >= 3.0 else \
                        colors.orange if promedio_general >= 2.0 else colors.red
        
        resumen_texto = f"""
        <para align="center">
        <font color="{color_promedio.hexval()}" size="14"><b>Promedio General: {promedio_general}/5.0</b></font><br/>
        <font size="10">
        • Total de evaluaciones realizadas: <b>{len(evaluaciones)}</b><br/>
        • GACs evaluados: <b>{len(gacs_data)}</b><br/>
        • RACs evaluados: <b>{len(rac_data)}</b><br/>
        • Estado: <b>{"Excelente" if promedio_general >= 4.0 else "Bueno" if promedio_general >= 3.0 else "Regular" if promedio_general >= 2.0 else "Necesita Mejora"}</b>
        </font>
        </para>
        """
        
        resumen = Paragraph(resumen_texto, estilos['texto'])
        story.append(resumen)
        
        # Pie de página
        story.append(Spacer(1, 20))
        fecha_generacion = datetime.now().strftime("%d/%m/%Y %H:%M")
        pie = Paragraph(f"📅 Reporte generado el {fecha_generacion} por el Sistema de Evaluación de Competencias", estilos['texto'])
        story.append(pie)
        
        # Construir PDF
        print("Construyendo PDF...")
        try:
            doc.build(story)
            print("PDF construido exitosamente")
        except Exception as e:
            print(f"Error al construir PDF: {e}")
            raise e
        
        # Preparar respuesta
        print("Preparando respuesta...")
        try:
            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="resultados_detallados_{estudiante.nombre.replace(" ", "_")}.pdf"'
            print("Respuesta preparada exitosamente")
            return response
        except Exception as e:
            print(f"Error al preparar respuesta: {e}")
            raise e
        
    except Exception as e:
        print(f"Error generando PDF individual: {e}")
        import traceback
        print(f"Traceback completo: {traceback.format_exc()}")
        return Response({'error': f'Error al generar PDF: {str(e)}'}, status=500)

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


# ===============================
# VISTAS PARA PERÍODOS ACADÉMICOS
# ===============================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_periodos_academicos(request):
    """Obtener todos los períodos académicos ordenados por año y semestre"""
    try:
        periodos = PeriodoAcademico.objects.all().order_by('-año', '-semestre')
        serializer = PeriodoAcademicoSerializer(periodos, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_periodo_actual(request):
    """Obtener el período académico actual"""
    try:
        periodo_actual = PeriodoAcademico.get_periodo_actual()
        serializer = PeriodoAcademicoSerializer(periodo_actual)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_periodo_academico(request):
    """Crear un nuevo período académico"""
    try:
        serializer = PeriodoAcademicoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)