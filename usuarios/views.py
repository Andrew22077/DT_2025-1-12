from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import  ProfesorSerializer
from .models import Profesor 
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
@api_view(['POST'])
def login_view(request):
    correo = request.data.get('correo')
    contrasenia = request.data.get('contrasenia')

    if not correo or not contrasenia:
        return Response({'error': 'Correo y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request._request, correo=correo, password=contrasenia)

    if user is None:
        return Response({'error': 'Correo o contraseña incorrectos'}, status=status.HTTP_401_UNAUTHORIZED)

    django_login(request._request, user)

    token, _ = Token.objects.get_or_create(user=user)

    # Serializar usuario para retornarlo
    serializer = ProfesorSerializer(user)

    return Response({
        'token': token.key,
        'user': serializer.data,
        'acceso': user.is_staff
    })
@api_view(['POST'])
def register(request):
    serializer = ProfesorSerializer(data=request.data)
    if serializer.is_valid():
        profesor = Profesor.objects.create_user(
            correo=serializer.validated_data['correo'],
            nombre=serializer.validated_data['nombre'],
            cedula=serializer.validated_data['cedula'],
            contrasenia=serializer.validated_data['contrasenia']
        )
        return Response({"mensaje": "Profesor registrado con éxito."}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def profile(request):
    return Response({})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({'mensaje': 'Sesión cerrada exitosamente.'}, status=status.HTTP_200_OK)
    except:
        return Response({'error': 'Error al cerrar sesión.'}, status=status.HTTP_400_BAD_REQUEST)


