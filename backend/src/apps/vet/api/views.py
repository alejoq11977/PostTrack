from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.http import StreamingHttpResponse
import json
import time

from apps.monitoring.models import Report, SurgicalMonitoring
from apps.monitoring.serializers.monitoring import ReportHistorySerializer
from apps.patients.models import Patient
from apps.users.models import User
from apps.vet.serializers import VetReportSerializer, VetOwnerSerializer, VetPatientSerializer, VetMonitoringSerializer, VetMonitoringCreateSerializer
from apps.clinics.models import VetClinic


class VetReportsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return VetReportSerializer

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

        queryset = Report.objects.filter(
            monitoring__patient__clinic_id__in=clinic_ids
        ).select_related(
            'monitoring',
            'monitoring__patient',
            'monitoring__patient__owner'
        ).order_by('-submitted_at')

        filter_param = self.request.query_params.get('filter')
        if filter_param == 'pending':
            queryset = queryset.filter(review_status='PENDING')
        elif filter_param == 'reviewed':
            queryset = queryset.filter(review_status='REVIEWED')

        return queryset


class VetReportsDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetReportSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        return Report.objects.filter(
            monitoring__patient__clinic_id__in=clinic_ids
        ).select_related(
            'monitoring',
            'monitoring__patient',
            'monitoring__patient__owner'
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def vet_reports_validate(request, pk):
    try:
        user = request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        report = Report.objects.get(pk=pk, monitoring__patient__clinic_id__in=clinic_ids)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    validated_risk = request.data.get('validated_risk')
    justification = request.data.get('justification', '')

    if validated_risk:
        report.validated_risk = validated_risk
        report.review_status = 'REVIEWED'
        report.save()

    return Response({'status': 'updated'})


class VetOwnersListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VetOwnerSerializer
        return VetOwnerSerializer

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

        queryset = User.objects.filter(
            role='OWNER',
            patients__clinic_id__in=clinic_ids
        ).distinct().order_by('-created_at')

        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(full_name__icontains=search)

        return queryset

    def perform_create(self, serializer):
        serializer.save(role='OWNER')


class VetOwnerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetOwnerSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        return User.objects.filter(
            role='OWNER',
            patients__clinic_id__in=clinic_ids
        ).distinct()


class VetPatientsSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetPatientSerializer

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

        queryset = Patient.objects.filter(clinic_id__in=clinic_ids, is_active=True).select_related('owner')

        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by('name')[:20]


class VetMonitoringsListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VetMonitoringCreateSerializer
        return VetMonitoringSerializer

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        return SurgicalMonitoring.objects.filter(
            patient__clinic_id__in=clinic_ids
        ).select_related('patient', 'patient__owner').order_by('-created_at')


@api_view(['GET'])
@permission_classes([AllowAny])
def vet_sse_alerts(request):
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from django.contrib.auth import get_user_model

    if not firebase_admin._apps:
        from apps.users.services.firebase import initialize_firebase
        initialize_firebase()

    auth_header = request.META.get('HTTP_AUTHORIZATION')
    token = None

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif request.query_params.get('token'):
        token = request.query_params.get('token')

    if not token:
        return Response({'error': 'Token required'}, status=401)

    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get('uid')

        User = get_user_model()
        try:
            user = User.objects.get(firebase_uid=uid)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

    except Exception as e:
        return Response({'error': f'Invalid token: {str(e)}'}, status=401)

    def event_stream():
        clinic_ids = list(VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True))

        while True:
            try:
                time.sleep(5)

                pending_reports = Report.objects.filter(
                    monitoring__patient__clinic_id__in=clinic_ids,
                    review_status='PENDING'
                ).select_related(
                    'monitoring',
                    'monitoring__patient',
                    'monitoring__patient__owner'
                ).order_by('submitted_at')[:10]

                data = {
                    'type': 'reports_update',
                    'count': pending_reports.count(),
                    'reports': VetReportSerializer(pending_reports, many=True).data
                }

                yield f"data: {json.dumps(data)}\n\n"
            except GeneratorExit:
                break

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response