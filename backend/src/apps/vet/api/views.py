from django.utils import timezone
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
from apps.vet.serializers import VetReportSerializer, VetReportDetailSerializer, VetOwnerSerializer, VetOwnerCreateSerializer, VetPatientSerializer, VetMonitoringSerializer, VetMonitoringCreateSerializer
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
    serializer_class = VetReportDetailSerializer
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
        report.save()

    return Response({'status': 'updated'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def vet_reports_mark_reviewed(request, pk):
    try:
        user = request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        report = Report.objects.get(pk=pk, monitoring__patient__clinic_id__in=clinic_ids)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    report.review_status = 'REVIEWED'
    report.reviewed_at = timezone.now()
    report.save()

    return Response({'status': 'reviewed', 'review_status': 'REVIEWED'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_reports_stats(request):
    from django.utils import timezone
    from datetime import timedelta

    user = request.user
    clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    pending_count = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        review_status='PENDING'
    ).count()

    reviewed_today = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        review_status='REVIEWED',
        reviewed_at__gte=today_start
    ).count()

    total_active = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        monitoring__status='ACTIVE'
    ).count()

    high_risk = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        review_status='PENDING',
        calculated_risk='HIGH'
    ).count()

    return Response({
        'pending': pending_count,
        'reviewed_today': reviewed_today,
        'total_active': total_active,
        'high_risk': high_risk
    })


class VetOwnersListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VetOwnerCreateSerializer
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


@permission_classes([AllowAny])
def vet_sse_alerts(request):
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from django.contrib.auth import get_user_model
    from django.http import StreamingHttpResponse
    import json
    import time

    if not firebase_admin._apps:
        from apps.users.services.firebase import initialize_firebase
        initialize_firebase()

    auth_header = request.META.get('HTTP_AUTHORIZATION')
    token = None

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif request.GET.get('token'):
        token = request.GET.get('token')

    if not token:
        return StreamingHttpResponse(
            iter([f"data: {json.dumps({'error': 'Token required', 'type': 'auth_error'})}\n\n"]),
            status=401,
            content_type='text/event-stream'
        )

    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get('uid')

        User = get_user_model()
        try:
            user = User.objects.get(firebase_uid=uid)
        except User.DoesNotExist:
            return StreamingHttpResponse(
                iter([f"data: {json.dumps({'error': 'User not found', 'type': 'auth_error'})}\n\n"]),
                status=401,
                content_type='text/event-stream'
            )

    except Exception as e:
        return StreamingHttpResponse(
            iter([f"data: {json.dumps({'error': f'Invalid token: {str(e)}', 'type': 'auth_error'})}\n\n"]),
            status=401,
            content_type='text/event-stream'
        )

    def event_stream():
        clinic_ids = list(VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True))

        try:
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE stream started'})}\n\n"
        except GeneratorExit:
            return

        risk_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, None: 3}

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
                )

                high_risk = pending_reports.filter(calculated_risk='HIGH')
                medium_risk = pending_reports.filter(calculated_risk='MEDIUM')
                low_risk = pending_reports.filter(calculated_risk='LOW')
                no_risk = pending_reports.filter(calculated_risk__isnull=True)

                sorted_reports = list(high_risk) + list(medium_risk) + list(low_risk) + list(no_risk)

                data = {
                    'type': 'reports_update',
                    'count': pending_reports.count(),
                    'alert_count': high_risk.count(),
                    'alerts': VetReportSerializer(sorted_reports[:10], many=True).data,
                    'reports': VetReportSerializer(pending_reports.order_by('-submitted_at')[:20], many=True).data
                }

                yield f"data: {json.dumps(data)}\n\n"
            except GeneratorExit:
                break

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_alerts_all(request):
    user = request.user
    clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

    pending_reports = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        review_status='PENDING'
    ).select_related(
        'monitoring',
        'monitoring__patient',
        'monitoring__patient__owner'
    )

    high_risk = pending_reports.filter(calculated_risk='HIGH')
    medium_risk = pending_reports.filter(calculated_risk='MEDIUM')
    low_risk = pending_reports.filter(calculated_risk='LOW')
    no_risk = pending_reports.filter(calculated_risk__isnull=True)

    sorted_reports = list(high_risk) + list(medium_risk) + list(low_risk) + list(no_risk)

    data = {
        'count': pending_reports.count(),
        'alert_count': high_risk.count(),
        'results': VetReportSerializer(sorted_reports, many=True).data
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_missing_reports(request):
    from datetime import datetime, timedelta
    from django.utils import timezone

    user = request.user
    clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)

    active_monitorings = SurgicalMonitoring.objects.filter(
        patient__clinic_id__in=clinic_ids,
        status='ACTIVE'
    ).select_related(
        'patient',
        'patient__owner'
    )

    missing_reports = []

    for monitoring in active_monitorings:
        last_report = monitoring.reports.order_by('-submitted_at').first()
        now = timezone.now()

        if last_report:
            expected_next = last_report.submitted_at + timedelta(hours=monitoring.report_frequency_hours)
        else:
            expected_next = monitoring.surgery_date + timedelta(hours=monitoring.report_frequency_hours)

        if now > expected_next:
            days_since_surgery = (now.date() - monitoring.surgery_date.date()).days + 1

            missing_reports.append({
                'id': monitoring.id,
                'patient_name': monitoring.patient.name,
                'patient_photo': monitoring.patient.photo_url,
                'owner_name': monitoring.patient.owner.full_name,
                'owner_phone': monitoring.patient.owner.phone_number,
                'owner_email': monitoring.patient.owner.email,
                'surgery_type': monitoring.surgery_type,
                'surgery_date': monitoring.surgery_date,
                'day_number': days_since_surgery,
                'report_frequency_hours': monitoring.report_frequency_hours,
                'last_report_at': last_report.submitted_at if last_report else None,
                'expected_at': expected_next,
                'minutes_overdue': int((now - expected_next).total_seconds() / 60)
            })

    missing_reports.sort(key=lambda x: x['minutes_overdue'], reverse=True)

    return Response({
        'count': len(missing_reports),
        'results': missing_reports
    })