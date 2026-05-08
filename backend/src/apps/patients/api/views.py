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

        result = evaluate_risk(answers)

        return Response({
            'level': result.level,
            'counts': result.counts,
            'applied_rules': result.applied_rules
        })