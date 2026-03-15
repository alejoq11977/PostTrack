from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.serializers.user import UserProfileSerializer

class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve los datos del usuario autenticado."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)