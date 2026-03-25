from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView

from ..serializers.monitoring import MonitoringFormSerializer, GeneralQuestionSerializer, ReportHistorySerializer
from apps.monitoring.services.report import create_monitoring_report

from apps.monitoring.repositories.monitoring import get_active_monitoring_for_owner, get_active_general_questions
from apps.monitoring.repositories.report import get_report_history_for_monitoring

class MonitoringFormAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        monitoring = get_active_monitoring_for_owner(pk, request.user)
        general_questions = get_active_general_questions()

        monitoring_data = MonitoringFormSerializer(monitoring).data
        general_data = GeneralQuestionSerializer(general_questions, many=True).data

        return Response({
            'monitoring': monitoring_data,
            'general_questions': general_data
        })

    def post(self, request, pk):
        monitoring = get_active_monitoring_for_owner(pk, request.user)

        try:
            report = create_monitoring_report(
                monitoring=monitoring,
                data=request.data,
                files=request.FILES
            )
            return Response(
                {"message": "Reporte creado exitosamente", "report_id": report.id}, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": "Ocurrió un error al procesar el reporte."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MonitoringHistoryAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportHistorySerializer

    def get_queryset(self):
        monitoring_id = self.kwargs.get('pk')
        return get_report_history_for_monitoring(monitoring_id, self.request.user)