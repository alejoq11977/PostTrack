from django.db import models
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.http import StreamingHttpResponse, JsonResponse
import json
import time

from apps.monitoring.models import Report, SurgicalMonitoring
from apps.monitoring.serializers.monitoring import ReportHistorySerializer
from apps.patients.models import Patient
from apps.users.models import User
from apps.vet.serializers import VetReportSerializer, VetReportDetailSerializer, VetOwnerSerializer, VetOwnerCreateSerializer, VetPatientSerializer, VetPatientCreateSerializer, VetPatientUpdateSerializer, VetMonitoringSerializer, VetMonitoringCreateSerializer
from apps.clinics.models import VetClinic


class ClinicFilteredMixin:
    """Mixin that provides clinic filtering for all vet views."""

    def get_clinic_ids(self):
        if not hasattr(self, '_clinic_ids'):
            self._clinic_ids = list(VetClinic.objects.filter(
                veterinarian=self.request.user, is_active=True
            ).values_list('clinic_id', flat=True))
        return self._clinic_ids

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['clinic_ids'] = self.get_clinic_ids()
        return context


class VetReportsListView(ClinicFilteredMixin, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination
    default_limit = 10

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

        monitoring_id = self.request.query_params.get('monitoring')
        if monitoring_id:
            queryset = queryset.filter(monitoring_id=monitoring_id)

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

    total_active = SurgicalMonitoring.objects.filter(
        patient__clinic_id__in=clinic_ids,
        status='ACTIVE'
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
            queryset = queryset.filter(
                models.Q(full_name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(identification_number__icontains=search)
            )

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        clinic_ids = list(VetClinic.objects.filter(
            veterinarian=user, is_active=True
        ).values_list('clinic_id', flat=True))
        context['clinic_ids'] = clinic_ids
        return context


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        clinic_ids = list(VetClinic.objects.filter(
            veterinarian=user, is_active=True
        ).values_list('clinic_id', flat=True))
        context['clinic_ids'] = clinic_ids
        return context


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


class VetPatientsCreateView(ClinicFilteredMixin, generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetPatientCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        owner_id = serializer.validated_data.pop('owner_id', None)
        if owner_id:
            serializer.validated_data['owner_id'] = owner_id
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class VetPatientsUpdateView(ClinicFilteredMixin, generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetPatientUpdateSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        clinic_ids = VetClinic.objects.filter(veterinarian=user, is_active=True).values_list('clinic_id', flat=True)
        return Patient.objects.filter(clinic_id__in=clinic_ids, is_active=True)


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
    from datetime import timedelta
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

        def get_reports_data_safe():
            try:
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

                active_monitorings = SurgicalMonitoring.objects.filter(
                    patient__clinic_id__in=clinic_ids,
                    status='ACTIVE'
                ).select_related('patient', 'patient__owner')
                missing_count = 0
                now = timezone.now()
                for monitoring in active_monitorings:
                    last_report = monitoring.reports.order_by('-submitted_at').first()
                    if last_report:
                        expected_next = last_report.submitted_at + timedelta(hours=monitoring.report_frequency_hours)
                    else:
                        expected_next = monitoring.surgery_date + timedelta(hours=monitoring.report_frequency_hours)
                    if now > expected_next:
                        missing_count += 1

                return {
                    'type': 'reports_update',
                    'count': pending_reports.count(),
                    'alert_count': high_risk.count(),
                    'missing_count': missing_count,
                    'reports': VetReportSerializer(pending_reports.order_by('-submitted_at')[:20], many=True).data
                }
            except Exception as e:
                print(f"[SSE] Error in get_reports_data_safe: {e}")
                return {
                    'type': 'reports_update',
                    'count': 0,
                    'alert_count': 0,
                    'missing_count': 0,
                    'reports': [],
                    'error': str(e)
                }

        try:
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE stream started'})}\n\n"
        except GeneratorExit:
            return

        while True:
            try:
                time.sleep(5)
                data = get_reports_data_safe()
                yield f"data: {json.dumps(data)}\n\n"
            except GeneratorExit:
                break
            except Exception as e:
                print(f"[SSE] Error in event stream loop: {e}")
                time.sleep(5)

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

    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 10))
    offset = (page - 1) * limit

    total_count = len(sorted_reports)
    paginated_reports = sorted_reports[offset:offset + limit]

    next_url = None
    if offset + limit < total_count:
        next_url = f"/api/vet/alerts/all/?page={page+1}&limit={limit}"

    prev_url = None
    if page > 1:
        prev_url = f"/api/vet/alerts/all/?page={page-1}&limit={limit}"

    data = {
        'count': total_count,
        'alert_count': high_risk.count(),
        'next': next_url,
        'previous': prev_url,
        'results': VetReportSerializer(paginated_reports, many=True).data
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
                'owner_identification_number': monitoring.patient.owner.identification_number,
                'surgery_type': monitoring.surgery_type,
                'surgery_date': monitoring.surgery_date,
                'day_number': days_since_surgery,
                'report_frequency_hours': monitoring.report_frequency_hours,
                'last_report_at': last_report.submitted_at if last_report else None,
                'expected_at': expected_next,
                'minutes_overdue': int((now - expected_next).total_seconds() / 60)
            })

    missing_reports.sort(key=lambda x: x['minutes_overdue'], reverse=True)

    limit = int(request.query_params.get('limit', 10))
    offset = int(request.query_params.get('offset', 0))

    total_count = len(missing_reports)
    paginated_reports = missing_reports[offset:offset + limit]

    next_url = None
    if offset + limit < total_count:
        next_url = f"/api/vet/reports/missing/?limit={limit}&offset={offset + limit}"

    return Response({
        'count': total_count,
        'next': next_url,
        'previous': None,
        'results': paginated_reports
    })