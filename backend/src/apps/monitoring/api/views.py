from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.monitoring.models import SurgicalMonitoring, GeneralQuestion, Report
from ..serializers.monitoring import MonitoringFormSerializer, GeneralQuestionSerializer, ReportHistorySerializer
from apps.monitoring.services.report import create_monitoring_report
from rest_framework.generics import ListAPIView

class MonitoringFormAPIView(APIView):
    permission_classes =[IsAuthenticated]

    def get(self, request, pk):
        """
        Obtiene los datos necesarios para armar el formulario de reporte en React.
        Requiere el ID (pk) del SurgicalMonitoring.
        """
        monitoring = get_object_or_404(
            SurgicalMonitoring, 
            pk=pk, 
            patient__owner=request.user,
            status='ACTIVE',
            is_active=True
        )

        general_questions = GeneralQuestion.objects.filter(is_active=True)

        monitoring_data = MonitoringFormSerializer(monitoring).data
        general_data = GeneralQuestionSerializer(general_questions, many=True).data

        return Response({
            'monitoring': monitoring_data,
            'general_questions': general_data
        })
    
    def post(self, request, pk):
        """
        Recibe las respuestas y las fotos, y crea el reporte.
        """
        monitoring = get_object_or_404(
            SurgicalMonitoring, 
            pk=pk, 
            patient__owner=request.user, 
            status='ACTIVE', 
            is_active=True
        )

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
    """
    Devuelve todos los reportes enviados para un seguimiento (cirugía) específico,
    ordenados del más reciente al más antiguo.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReportHistorySerializer

    def get_queryset(self):
        monitoring_id = self.kwargs.get('pk')
        
        return Report.objects.filter(
            monitoring_id=monitoring_id,
            monitoring__patient__owner=self.request.user,
            is_active=True
        ).order_by('-submitted_at')