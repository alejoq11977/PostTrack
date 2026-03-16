from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.serializers.user import UserProfileSerializer, OwnerCreateSerializer
from apps.users.services.user import create_owner_from_vet

class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve los datos del usuario autenticado."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
class VetCreateOwnerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Endpoint para que el Veterinario registre un Propietario (CU-04)"""
        
        if request.user.role not in ['VETERINARIAN', 'ADMIN']:
            return Response(
                {"error": "No tienes permisos para crear propietarios."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = OwnerCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                owner = create_owner_from_vet(
                    email=serializer.validated_data['email'],
                    full_name=serializer.validated_data['full_name'],
                    identification_number=serializer.validated_data['identification_number']
                )
                
                response_serializer = UserProfileSerializer(owner)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {"error": f"Error al crear usuario en Firebase: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)