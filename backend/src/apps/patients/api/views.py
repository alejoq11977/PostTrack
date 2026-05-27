from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from ..serializers.patient import PatientListSerializer

from apps.patients.repositories.patient import get_active_patients_by_owner, get_active_patients_by_owner_and_clinic
from apps.patients.services.risk_evaluation import evaluate_risk, AnswerInput

class PatientListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PatientListSerializer

    def get_queryset(self):
        clinic_id = self.request.query_params.get('clinic_id')
        if clinic_id:
            return get_active_patients_by_owner_and_clinic(self.request.user, int(clinic_id))
        return get_active_patients_by_owner(self.request.user)


class EvaluateRiskAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        answers_data = request.data.get('answers', [])

        if not answers_data:
            return Response({'error': 'Se requiere lista de respuestas'}, status=400)

        try:
            answers = [
                AnswerInput(question_id=a['question_id'], answer=a['answer'])
                for a in answers_data
            ]
        except KeyError as e:
            return Response({'error': f'Falta campo requerido: {e}'}, status=400)

        # La ventana temporal se calcula desde la cirugía del seguimiento (si se envía).
        hours_since_surgery = None
        monitoring_id = request.data.get('monitoring_id')
        if monitoring_id:
            from django.utils import timezone
            from apps.monitoring.models import SurgicalMonitoring
            m = SurgicalMonitoring.objects.filter(id=monitoring_id, patient__owner=request.user).first()
            if m and m.surgery_date:
                hours_since_surgery = (timezone.now() - m.surgery_date).total_seconds() / 3600

        result = evaluate_risk(answers, hours_since_surgery=hours_since_surgery)

        return Response({
            'level': result.level,
            'counts': result.counts,
            'applied_rules': result.applied_rules,
            'window': result.window,
        })