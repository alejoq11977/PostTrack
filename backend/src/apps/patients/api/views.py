from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from apps.patients.models import Patient
from ..serializers.patient import PatientListSerializer

class PatientListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientListSerializer

    def get_queryset(self):
        """
        Devuelve únicamente los pacientes que le pertenecen al usuario 
        que está haciendo la petición (dueño) y que estén activos (soft delete).
        """
        return Patient.objects.filter(owner=self.request.user, is_active=True).order_by('-created_at')