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
def register(request):
    serializer = ProfesorSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response({"mensaje": "Profesor registrado con éxito."}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
def logout(request):
    try:
        
        request.user.auth_token.delete()  # Eliminar el token de autenticación
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