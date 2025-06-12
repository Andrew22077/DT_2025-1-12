from rest_framework.decorators import api_view, permission_classes  # Asegúrate de importar permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login as django_login
from rest_framework.permissions import AllowAny
from .models import Profesor
from .serializers import ProfesorSerializer
from .permissions import IsStaffUser
import pandas as pd
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    correo = request.data.get('correo')
    contrasenia = request.data.get('contrasenia')

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
    serializer = ProfesorSerializer(user)

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
    # Aquí puedes agregar un print para depurar el usuario autenticado
    print(f"Usuario autenticado: {request.user}")  # Esto es útil para depurar

    profesores = Profesor.objects.all()
    serializer = ProfesorSerializer(profesores, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profesor_detail(request, id):
    try:
        profesor = Profesor.objects.get(id=id)
    except Profesor.DoesNotExist:
        return Response({'error': 'Profesor no encontrado'}, status=404)

    if request.method == 'GET':
        serializer = ProfesorSerializer(profesor)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()
        # Si la contraseña no se actualiza, elimínala
        if not data.get('contrasenia'):
            data.pop('contrasenia', None)

        serializer = ProfesorSerializer(profesor, data=data, partial=True)
        if serializer.is_valid():
            if 'contrasenia' in data:
                profesor.set_password(data['contrasenia'])
                profesor.save()
            serializer.save()
            return Response(serializer.data)
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
    serializer = ProfesorSerializer(profesor)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Función para exportar profesores a Excel
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_teachers_excel(request):
    # Obtener todos los profesores
    teachers = Teacher.objects.all().values()
    
    # Crear un DataFrame con los datos
    df = pd.DataFrame(list(teachers))
    
    # Crear una respuesta HTTP con el archivo Excel
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=teachers.xlsx'
    
    # Guardar el DataFrame como Excel
    df.to_excel(response, index=False)
    
    return response

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

    # Si no se quiere actualizar la contraseña, la eliminamos de los datos
    if not data.get('contrasenia'):
        data.pop('contrasenia', None)

    serializer = ProfesorSerializer(usuario, data=data, partial=True)
    if serializer.is_valid():
        if 'contrasenia' in data:
            usuario.set_password(data['contrasenia'])
            usuario.save()
        serializer.save()
        return Response({'mensaje': 'Perfil actualizado correctamente', 'usuario': serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)