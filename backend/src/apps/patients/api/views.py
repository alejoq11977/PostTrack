from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from ..serializers.patient import PatientListSerializer

from apps.patients.repositories.patient import get_active_patients_by_owner

class PatientListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientListSerializer

    def get_queryset(self):
        return get_active_patients_by_owner(self.request.user)