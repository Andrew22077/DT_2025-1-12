from rest_framework.decorators import api_view, permission_classes  # Asegúrate de importar permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login as django_login
from rest_framework.permissions import AllowAny
from .models import Profesor
from .serializers import ProfesorSerializer, ProfesorPerfilSerializer, ProfesorFotoSerializer
from .permissions import IsStaffUser
import pandas as pd
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Estudiante
from .serializers import EstudianteSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    print("=== DEBUG LOGIN VIEW ===")
    
    print("Content-Type:", request.content_type)
    print("request.data:", request.data)
    print("request.POST:", request.POST)
    print("request.body:", request.body)
    print("=== DEBUG AUTH ===")
    

    print("========================")
    correo = request.data.get('correo')
    contrasenia = request.data.get('contrasenia')
    print("correo:", correo)
    print("password:", contrasenia)
    # Verificar que el correo y la contraseña estén presentes en la solicitud
    if not correo or not contrasenia:
        return Response({'error': 'Correo y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    # Autenticación: Usamos el correo en lugar de username, y la contraseña
    user = authenticate(request, correo=correo, password=contrasenia)

    if user is None:
        return Response({'error': 'Correo o contraseña incorrectos'}, status=status.HTTP_401_UNAUTHORIZED)

    # Iniciar sesión en Django
    django_login(request, user)

    # Crear o obtener el token de autenticación
    token, _ = Token.objects.get_or_create(user=user)

    # Serializar la información del usuario
    serializer = ProfesorPerfilSerializer(user)

    # Devolver la respuesta con el token y la información del usuario
    return Response({
        'token': token.key,
        'user': serializer.data,
        'acceso': user.is_staff
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser]) 
def register(request):
    serializer = ProfesorSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({"mensaje": "Profesor registrado con éxito."}, status=201)

    return Response(serializer.errors, status=400)
    

@api_view(['POST'])
def logout(request):
    try:
        
        request.user.auth_token.delete()  
        return Response({'mensaje': 'Sesión cerrada exitosamente.'}, status=status.HTTP_200_OK)
    except:
        return Response({'error': 'Error al cerrar sesión.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])  # Asegúrate de que solo los usuarios autenticados y con permisos de staff pueden acceder
def listar_profesores(request):
    profesores = Profesor.objects.all()
    serializer = ProfesorPerfilSerializer(profesores, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profesor_detail(request, id):
    try:
        profesor = Profesor.objects.get(id=id)
    except Profesor.DoesNotExist:
        return Response({'error': 'Profesor no encontrado'}, status=404)

    if request.method == 'GET':
        serializer = ProfesorPerfilSerializer(profesor)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()
        print(f"Datos recibidos en profesor_detail: {data}")
        print(f"Materias en datos: {data.get('materias', 'No hay materias')}")
        
        # Si la contraseña no se actualiza, elimínala
        if not data.get('contrasenia'):
            data.pop('contrasenia', None)

        serializer = ProfesorPerfilSerializer(profesor, data=data, partial=True)
        if serializer.is_valid():
            try:
                if 'contrasenia' in data:
                    profesor.set_password(data['contrasenia'])
                    profesor.save()
                serializer.save()
                print(f"Profesor actualizado correctamente: {serializer.data}")
                return Response(serializer.data)
            except Exception as e:
                print(f"Error al guardar profesor: {e}")
                return Response({'error': f'Error al guardar: {str(e)}'}, status=500)
        else:
            print(f"Errores de validación en profesor_detail: {serializer.errors}")
            return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsStaffUser])  # Solo los administradores pueden cambiar el estado
def update_profesor_status(request, id):
    try:
        profesor = Profesor.objects.get(id=id)
    except Profesor.DoesNotExist:
        return Response({'error': 'Profesor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # Cambiar is_staff o is_active según el cuerpo de la solicitud
    is_admin = request.data.get('is_staff', None)
    is_active = request.data.get('is_active', None)

    if is_admin is not None:
        profesor.is_staff = is_admin
    if is_active is not None:
        profesor.is_active = is_active

    profesor.save()

    # Serializar el objeto actualizado
    serializer = ProfesorPerfilSerializer(profesor)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Nueva vista para actualizar solo la foto del profesor
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_foto_profesor(request, id):
    """Actualizar solo la foto de un profesor"""
    try:
        # Verificar que el usuario solo pueda actualizar su propia foto o sea admin
        if not request.user.is_staff and request.user.id != id:
            return Response({
                'error': 'No tienes permisos para actualizar la foto de otro profesor'
            }, status=status.HTTP_403_FORBIDDEN)
        
        profesor = Profesor.objects.get(id=id)
    except Profesor.DoesNotExist:
        return Response({'error': 'Profesor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProfesorFotoSerializer(profesor, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        # Retornar el perfil completo actualizado
        perfil_serializer = ProfesorPerfilSerializer(profesor)
        return Response({
            'mensaje': 'Foto actualizada correctamente',
            'profesor': perfil_serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def export_excel_profesores(request):
    """Exportar profesores a Excel"""
    try:
        profesores = Profesor.objects.all().order_by('nombre')
        
        # Crear DataFrame con los datos
        serializer = ProfesorPerfilSerializer(profesores, many=True)
        df = pd.DataFrame(serializer.data)
        
        if df.empty:
            return Response({
                'error': 'No hay profesores para exportar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Renombrar columnas para el Excel
        df = df.rename(columns={
            'cedula': 'CÉDULA',
            'nombre': 'NOMBRE',
            'correo': 'CORREO',
            'is_active': 'ACTIVO',
            'is_staff': 'ES ADMIN',
            'foto': 'TIENE FOTO'
        })
        
        # Convertir valores booleanos a texto legible
        df['ACTIVO'] = df['ACTIVO'].map({True: 'SÍ', False: 'NO'})
        df['ES ADMIN'] = df['ES ADMIN'].map({True: 'SÍ', False: 'NO'})
        df['TIENE FOTO'] = df['TIENE FOTO'].map({True: 'SÍ', False: 'NO'})
        
        # Crear respuesta HTTP
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'profesores_{pd.Timestamp.now().strftime("%Y%m%d_%H%M")}.xlsx'
        response['Content-Disposition'] = f'attachment; filename={filename}'
        
        # Crear Excel con información adicional
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            # Información del archivo
            info_df = pd.DataFrame({
                'Información': [
                    'Archivo generado el:',
                    'Total de profesores:',
                    'Profesores activos:',
                    'Profesores administradores:',
                    'Profesores con foto:',
                    'Generado por:'
                ],
                'Valor': [
                    pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
                    len(df),
                    len(df[df['ACTIVO'] == 'SÍ']),
                    len(df[df['ES ADMIN'] == 'SÍ']),
                    len(df[df['TIENE FOTO'] == 'SÍ']),
                    request.user.nombre
                ]
            })
            info_df.to_excel(writer, sheet_name='Profesores', index=False, startrow=0)
            
            # Datos principales
            df.to_excel(writer, sheet_name='Profesores', index=False, startrow=6)
            
            # Resumen por estado
            estado_summary = df.groupby('ACTIVO').size().reset_index(name='CANTIDAD')
            estado_summary.to_excel(writer, sheet_name='Resumen por Estado', index=False)
            
            # Resumen por rol
            admin_summary = df.groupby('ES ADMIN').size().reset_index(name='CANTIDAD')
            admin_summary.to_excel(writer, sheet_name='Resumen por Rol', index=False)
        
        return response
        
    except Exception as e:
        return Response({
            'error': f'Error al exportar Excel: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Función para importar profesores desde Excel
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_excel_profesores(request):
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No se proporcionó archivo'}, status=status.HTTP_400_BAD_REQUEST)

        excel_file = request.FILES['file']

        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response({'error': 'El archivo debe ser Excel (.xlsx o .xls)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(excel_file, skiprows=3)
        except Exception as e:
            return Response({'error': f'Error al leer el archivo Excel: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        required_columns = {
            'APELLIDOS NOMBRES': 'nombre_completo',
            'No. DE IDENTIFICACIÓN': 'cedula',
            'CORREO  INSTITUCIONAL': 'correo_institucional',  # OJO: doble espacio
            'CORREO PERSONAL': 'correo_personal'
        }

        obligatory_columns = ['APELLIDOS NOMBRES', 'No. DE IDENTIFICACIÓN']
        missing_columns = [col for col in obligatory_columns if col not in df.columns]

        if missing_columns:
            return Response({
                'error': f'Faltan las siguientes columnas obligatorias: {", ".join(missing_columns)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Procesar y limpiar datos
        processed_data = {}
        for excel_col, field_name in required_columns.items():
            if excel_col in df.columns:
                processed_data[field_name] = df[excel_col].fillna('').astype(str).str.strip()
            else:
                processed_data[field_name] = pd.Series([''] * len(df))

        processed_df = pd.DataFrame(processed_data)

        created_count = 0
        errors = []

        for index, row in processed_df.iterrows():
            try:
                nombre_completo = row.get('nombre_completo', '').strip()
                cedula = ''.join(filter(str.isdigit, row.get('cedula', '').strip()))

                # Obtener correo institucional y personal
                correo_institucional = row.get('correo_institucional', '').strip()
                correo_personal = row.get('correo_personal', '').strip()

                # Validar y reemplazar si es necesario
                if not correo_institucional or correo_institucional.lower() == 'nan':
                    correo = correo_personal
                else:
                    correo = correo_institucional

                if not nombre_completo or not cedula:
                    errors.append(f"Fila {index + 2}: Nombre o cédula faltante o vacía")
                    continue

                if len(cedula) < 6:
                    errors.append(f"Fila {index + 2}: Cédula inválida ({cedula})")
                    continue

                profesor_data = {
                    'nombre': nombre_completo,
                    'cedula': cedula,
                    'correo': correo,
                    'contrasenia': cedula  # Contraseña por defecto
                }

                serializer = ProfesorSerializer(data=profesor_data)

                if serializer.is_valid():
                    serializer.save()
                    created_count += 1
                else:
                    errors.append(f"Fila {index + 2}: {serializer.errors}")

            except Exception as e:
                errors.append(f"Fila {index + 2}: Error inesperado - {str(e)}")
                continue

        return Response({
            'message': 'Importación completada',
            'created': created_count,
            'total_rows': len(processed_df),
            'errors': errors
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Error inesperado al procesar archivo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_perfil_usuario(request):
    usuario = request.user  # Usuario autenticado

    data = request.data.copy()
    print(f"Datos recibidos: {data}")

    # Si no se quiere actualizar la contraseña, la eliminamos de los datos
    if not data.get('contrasenia'):
        data.pop('contrasenia', None)

    serializer = ProfesorPerfilSerializer(usuario, data=data, partial=True)
    if serializer.is_valid():
        try:
            if 'contrasenia' in data:
                usuario.set_password(data['contrasenia'])
                usuario.save()
            serializer.save()
            return Response({'mensaje': 'Perfil actualizado correctamente', 'usuario': serializer.data})
        except Exception as e:
            print(f"Error al guardar: {e}")
            return Response({'error': f'Error al guardar: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        print(f"Errores de validación: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#Estudiantes
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_estudiantes(request):
    """Listar todos los estudiantes"""
    try:
        estudiantes = Estudiante.objects.all()
        serializer = EstudianteSerializer(estudiantes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener estudiantes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def estudiante_detail(request, id):
    """Obtener, actualizar o eliminar un estudiante específico"""
    try:
        estudiante = Estudiante.objects.get(id=id)
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = EstudianteSerializer(estudiante)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        # Solo staff puede actualizar estudiantes
        if not request.user.is_staff:
            return Response({
                'error': 'No tienes permisos para actualizar estudiantes'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = EstudianteSerializer(estudiante, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Solo staff puede eliminar estudiantes
        if not request.user.is_staff:
            return Response({
                'error': 'No tienes permisos para eliminar estudiantes'
            }, status=status.HTTP_403_FORBIDDEN)
        
        estudiante_nombre = estudiante.nombre
        estudiante.delete()
        return Response({
            'mensaje': f'Estudiante {estudiante_nombre} eliminado exitosamente'
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser])
def register_estudiante(request):
    """Registrar un nuevo estudiante"""
    try:
        serializer = EstudianteSerializer(data=request.data)
        if serializer.is_valid():
            estudiante = serializer.save()
            return Response({
                'mensaje': 'Estudiante registrado exitosamente',
                'estudiante': EstudianteSerializer(estudiante).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Error al registrar estudiante: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estudiantes_por_grupo(request, grupo):
    """Obtener estudiantes de un grupo específico"""
    try:
        estudiantes = Estudiante.objects.filter(grupo__iexact=grupo).order_by('nombre')
        serializer = EstudianteSerializer(estudiantes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener estudiantes del grupo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grupos(request):
    """Obtener lista de grupos únicos"""
    try:
        grupos = Estudiante.objects.values_list('grupo', flat=True).distinct().order_by('grupo')
        grupos_list = [grupo for grupo in grupos if grupo]  # Filtrar grupos vacíos
        return Response({
            'grupos': grupos_list,
            'total': len(grupos_list)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener grupos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def export_excel_estudiantes(request):
    """Exportar estudiantes a Excel"""
    try:
        estudiantes = Estudiante.objects.all().order_by('grupo', 'nombre')
        
        # Crear DataFrame con los datos
        serializer = EstudianteSerializer(estudiantes, many=True)
        df = pd.DataFrame(serializer.data)
        
        if df.empty:
            return Response({
                'error': 'No hay estudiantes para exportar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Renombrar columnas para el Excel
        df = df.rename(columns={
            'documento': 'DOCUMENTO',
            'nombre': 'NOMBRE',
            'correo': 'CORREO',
            'grupo': 'GRUPO',
            'created_at': 'FECHA CREACIÓN',
            'updated_at': 'FECHA ACTUALIZACIÓN'
        })
        
        # Formatear fechas
        if 'FECHA CREACIÓN' in df.columns:
            df['FECHA CREACIÓN'] = pd.to_datetime(df['FECHA CREACIÓN']).dt.strftime('%Y-%m-%d %H:%M')
        if 'FECHA ACTUALIZACIÓN' in df.columns:
            df['FECHA ACTUALIZACIÓN'] = pd.to_datetime(df['FECHA ACTUALIZACIÓN']).dt.strftime('%Y-%m-%d %H:%M')
        
        # Crear respuesta HTTP
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'estudiantes_{pd.Timestamp.now().strftime("%Y%m%d_%H%M")}.xlsx'
        response['Content-Disposition'] = f'attachment; filename={filename}'
        
        # Crear Excel con información adicional
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            # Información del archivo
            info_df = pd.DataFrame({
                'Información': [
                    'Archivo generado el:',
                    'Total de estudiantes:',
                    'Total de grupos:',
                    'Generado por:'
                ],
                'Valor': [
                    pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
                    len(df),
                    df['GRUPO'].nunique(),
                    request.user.nombre
                ]
            })
            info_df.to_excel(writer, sheet_name='Estudiantes', index=False, startrow=0)
            
            # Datos principales
            df.to_excel(writer, sheet_name='Estudiantes', index=False, startrow=5)
            
            # Resumen por grupos
            if 'GRUPO' in df.columns:
                grupo_summary = df.groupby('GRUPO').size().reset_index(name='CANTIDAD')
                grupo_summary.to_excel(writer, sheet_name='Resumen por Grupo', index=False)
        
        return response
        
    except Exception as e:
        return Response({
            'error': f'Error al exportar Excel: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStaffUser])
def import_excel_estudiantes(request):
    """Importar estudiantes desde Excel con múltiples hojas"""
    try:
        if 'file' not in request.FILES:
            return Response({
                'error': 'No se proporcionó archivo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = request.FILES['file']
        
        # Validar extensión
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            return Response({
                'error': 'El archivo debe ser Excel (.xlsx o .xls)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar tamaño (máximo 10MB)
        if excel_file.size > 10 * 1024 * 1024:
            return Response({
                'error': 'El archivo es demasiado grande (máximo 10MB)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Hojas objetivo
        target_sheets = ['GRUPO VIRTUAL 1', 'EGP- 1A', 'EGP-1B', 'EGP -1C', 'EGP-2A', 'EGP- 2B', 'EGP-2C']
        
        # Leer todas las hojas
        try:
            all_sheets = pd.read_excel(excel_file, sheet_name=None, header=None)
        except Exception as e:
            return Response({
                'error': f'Error al leer el archivo Excel: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        updated_count = 0
        errors = []
        sheets_processed = []
        
        def process_sheet(sheet_name, df):
            nonlocal created_count, updated_count, errors
            
            # Obtener el grupo de la fila 3, columna 2
            try:
                grupo = str(df.iloc[3, 2]).strip()
                if not grupo or grupo == 'nan':
                    grupo = sheet_name  # Usar el nombre de la hoja como fallback
            except:
                grupo = sheet_name
            
            # Buscar secciones PREMATRICULADOS y MATRICULADOS
            prematricula_start = None
            matriculados_start = None
            
            for i, row in df.iterrows():
                row_text = ' '.join([str(cell).upper() for cell in row if str(cell) != 'nan']).strip()
                
                if 'PREMATRICULA' in row_text:
                    prematricula_start = i
                elif 'MATRICULA' in row_text and 'PREMATRICULA' not in row_text:
                    matriculados_start = i
            
            sheet_students = 0
            
            def process_section(start_row, estado):
                nonlocal sheet_students
                
                if start_row is None:
                    return
                
                # Los encabezados están siempre en start_row + 1
                header_row = start_row + 1
                data_start = start_row + 2
                
                # Determinar dónde termina esta sección
                end_row = len(df)
                if estado == 'prematricula' and matriculados_start is not None:
                    end_row = matriculados_start
                
                # Procesar cada fila de estudiantes
                for i in range(data_start, end_row):
                    try:
                        if i >= len(df):
                            break
                            
                        row = df.iloc[i]
                        
                        # Extraer datos (columnas: No., DOCUMENTO, APELLIDOS Y NOMBRES, EMAIL INSTITUCIONAL)
                        documento = str(row.iloc[1]).strip() if len(row) > 1 else ""
                        nombre = str(row.iloc[2]).strip() if len(row) > 2 else ""
                        correo = str(row.iloc[3]).strip() if len(row) > 3 else ""
                        
                        # Validar que no sea una fila vacía o de separación
                        if not documento or documento in ['nan', 'NaN', ''] or 'LISTADO' in str(row.iloc[0]).upper():
                            continue
                        
                        if not nombre or nombre in ['nan', 'NaN', '']:
                            continue
                        
                        # Limpiar documento (solo números)
                        documento = ''.join(filter(str.isdigit, documento))
                        if len(documento) < 6:
                            errors.append(f"{sheet_name} - {estado} - Fila {i+1}: Documento inválido ({documento})")
                            continue
                        
                        # Validar correo
                        if not correo or correo in ['nan', 'NaN', '']:
                            correo = f"temp{documento}@unbosque.edu.co"
                        else:
                            correo = correo.lower().strip()
                        
                        # Crear datos del estudiante
                        estudiante_data = {
                            'documento': documento,
                            'nombre': nombre.upper(),
                            'correo': correo,
                            'grupo': grupo,
                            'estado': estado
                        }
                        
                        # Verificar si ya existe
                        try:
                            estudiante_existente = Estudiante.objects.get(documento=documento)
                            # Actualizar datos existentes
                            serializer = EstudianteSerializer(estudiante_existente, data=estudiante_data, partial=True)
                            if serializer.is_valid():
                                serializer.save()
                                updated_count += 1
                                sheet_students += 1
                            else:
                                errors.append(f"{sheet_name} - {estado} - Fila {i+1}: Error al actualizar - {serializer.errors}")
                                
                        except Estudiante.DoesNotExist:
                            # Crear nuevo estudiante
                            serializer = EstudianteSerializer(data=estudiante_data)
                            if serializer.is_valid():
                                serializer.save()
                                created_count += 1
                                sheet_students += 1
                            else:
                                errors.append(f"{sheet_name} - {estado} - Fila {i+1}: Error al crear - {serializer.errors}")
                                
                    except Exception as e:
                        errors.append(f"{sheet_name} - {estado} - Fila {i+1}: Error inesperado - {str(e)}")
                        continue
            
            # Procesar ambas secciones
            process_section(prematricula_start, 'prematricula')
            process_section(matriculados_start, 'matriculado')
            
            return {
                'grupo': grupo,
                'estudiantes_procesados': sheet_students,
                'prematricula_row': prematricula_start,
                'matriculados_row': matriculados_start
            }
        
        # Procesar solo las hojas objetivo
        for sheet_name in target_sheets:
            if sheet_name in all_sheets:
                df = all_sheets[sheet_name]
                result = process_sheet(sheet_name, df)
                sheets_processed.append({
                    'hoja': sheet_name,
                    **result
                })
            else:
                errors.append(f"Hoja no encontrada: {sheet_name}")
        
        return Response({
            'mensaje': 'Importación completada',
            'hojas_procesadas': len(sheets_processed),
            'creados': created_count,
            'actualizados': updated_count,
            'total_estudiantes': created_count + updated_count,
            'detalle_hojas': sheets_processed,
            'errores': errors[:20] if errors else []  # Limitar errores mostrados
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error inesperado al procesar archivo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Obtener información del usuario autenticado"""
    try:
        user = request.user
        serializer = ProfesorPerfilSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Error al obtener perfil: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)