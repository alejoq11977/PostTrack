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
from apps.vet.serializers import VetReportSerializer, VetReportDetailSerializer, VetOwnerSerializer, VetOwnerCreateSerializer, VetOwnerUpdateSerializer, VetPatientSerializer, VetPatientCreateSerializer, VetPatientUpdateSerializer, VetMonitoringSerializer, VetMonitoringCreateSerializer
from apps.clinics.models import ClinicMembership


def _selected_clinic_ids(request):
    """
    Scope every vet query to the SINGLE clinic the user is currently in.

    The clinic is sent via the X-Clinic-Id header. We read it and validate it
    against the authenticated user's active memberships HERE (at the DRF view
    layer) — not in Django middleware — because Firebase auth runs at the view
    layer, so request.user is only populated here. We scope to that one clinic
    (never all of the user's clinics) so data never crosses between clinics.
    """
    cid = request.headers.get('X-Clinic-Id')
    if not cid:
        return []
    try:
        cid = int(cid)
    except (TypeError, ValueError):
        return []

    user = getattr(request, 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return []

    if getattr(user, 'role', None) == 'ADMIN':
        from apps.clinics.models import Clinic
        return [cid] if Clinic.objects.filter(id=cid, is_active=True).exists() else []

    from apps.clinics.models import ClinicMembership
    if ClinicMembership.objects.filter(user=user, clinic_id=cid, is_active=True).exists():
        return [cid]
    return []


class ClinicFilteredMixin:
    """Mixin that scopes vet views to the currently selected clinic."""

    def get_clinic_ids(self):
        if not hasattr(self, '_clinic_ids'):
            self._clinic_ids = _selected_clinic_ids(self.request)
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
        clinic_ids = _selected_clinic_ids(self.request)

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
        clinic_ids = _selected_clinic_ids(self.request)
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
        clinic_ids = _selected_clinic_ids(request)
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
        clinic_ids = _selected_clinic_ids(request)
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

    clinic_ids = _selected_clinic_ids(request)

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
        clinic_ids = _selected_clinic_ids(self.request)
        clinic_id = clinic_ids[0] if clinic_ids else None

        queryset = User.objects.filter(
            role='OWNER',
            clinic_memberships__clinic_id=clinic_id,
            clinic_memberships__is_active=True,
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
        context['clinic_ids'] = _selected_clinic_ids(self.request)
        return context


class VetOwnerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return VetOwnerUpdateSerializer
        return VetOwnerSerializer

    def get_queryset(self):
        clinic_ids = _selected_clinic_ids(self.request)
        clinic_id = clinic_ids[0] if clinic_ids else None
        return User.objects.filter(
            role='OWNER',
            clinic_memberships__clinic_id=clinic_id,
            clinic_memberships__is_active=True,
        ).distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['clinic_ids'] = _selected_clinic_ids(self.request)
        return context


class VetPatientsSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VetPatientSerializer

    def get_queryset(self):
        clinic_ids = _selected_clinic_ids(self.request)

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
        clinic_ids = _selected_clinic_ids(self.request)
        return Patient.objects.filter(clinic_id__in=clinic_ids, is_active=True)


class VetMonitoringsListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VetMonitoringCreateSerializer
        return VetMonitoringSerializer

    def get_queryset(self):
        clinic_ids = _selected_clinic_ids(self.request)
        return SurgicalMonitoring.objects.filter(
            patient__clinic_id__in=clinic_ids
        ).select_related('patient', 'patient__owner').order_by('-created_at')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_monitoring_release(request, pk):
    """Marcar salida de la clínica (la mascota se va a casa). Inicia el agendamiento de reportes."""
    clinic_ids = _selected_clinic_ids(request)
    try:
        monitoring = SurgicalMonitoring.objects.get(pk=pk, patient__clinic_id__in=clinic_ids)
    except SurgicalMonitoring.DoesNotExist:
        return Response({'error': 'Seguimiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    raw = request.data.get('home_release_date')
    release_dt = timezone.now()
    if raw:
        from django.utils.dateparse import parse_datetime
        parsed = parse_datetime(raw)
        if parsed:
            # El frontend envía un datetime-local sin zona; lo volvemos consciente.
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            release_dt = parsed
    monitoring.home_release_date = release_dt
    monitoring.save(update_fields=['home_release_date'])
    return Response({'status': 'released', 'home_release_date': monitoring.home_release_date})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_monitoring_discharge(request, pk):
    """Dar de alta / finalizar el seguimiento: deja de esperar reportes y bloquea al propietario."""
    clinic_ids = _selected_clinic_ids(request)
    try:
        monitoring = SurgicalMonitoring.objects.get(pk=pk, patient__clinic_id__in=clinic_ids)
    except SurgicalMonitoring.DoesNotExist:
        return Response({'error': 'Seguimiento no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    monitoring.status = 'DISCHARGED'
    monitoring.discharged_at = timezone.now()
    monitoring.save(update_fields=['status', 'discharged_at'])
    return Response({'status': 'discharged', 'discharged_at': monitoring.discharged_at})


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
        # EventSource can't send custom headers, so the selected clinic arrives as a
        # query param (?clinic_id=). Validate it against the user's active memberships
        # and scope to that single clinic. If none is provided we fall back to all of
        # the user's clinics (frontend wiring pending in Fase 5).
        user_clinic_ids = list(ClinicMembership.objects.filter(user=user, is_active=True).values_list('clinic_id', flat=True))
        requested_clinic = request.GET.get('clinic_id')
        try:
            requested_clinic = int(requested_clinic) if requested_clinic else None
        except (TypeError, ValueError):
            requested_clinic = None
        if requested_clinic and (getattr(user, 'role', None) == 'ADMIN' or requested_clinic in user_clinic_ids):
            clinic_ids = [requested_clinic]
        else:
            clinic_ids = user_clinic_ids

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

                # Orden por prioridad de riesgo (ALTO→MEDIO→BAJO→sin dato) y, dentro
                # de cada nivel, lo más reciente primero. Debe coincidir con
                # vet_alerts_all para que el orden no "salte" al llegar el SSE.
                high_risk = pending_reports.filter(calculated_risk='HIGH').order_by('-submitted_at')
                medium_risk = pending_reports.filter(calculated_risk='MEDIUM').order_by('-submitted_at')
                low_risk = pending_reports.filter(calculated_risk='LOW').order_by('-submitted_at')
                no_risk = pending_reports.filter(calculated_risk__isnull=True).order_by('-submitted_at')

                sorted_reports = list(high_risk) + list(medium_risk) + list(low_risk) + list(no_risk)

                # Solo seguimientos ya dados de salida (en casa) y aún activos.
                active_monitorings = SurgicalMonitoring.objects.filter(
                    patient__clinic_id__in=clinic_ids,
                    status='ACTIVE',
                    home_release_date__isnull=False
                ).select_related('patient', 'patient__owner')
                missing_list = []
                now = timezone.now()
                for monitoring in active_monitorings:
                    last_report = monitoring.reports.order_by('-submitted_at').first()
                    anchor = last_report.submitted_at if last_report else monitoring.home_release_date
                    expected_next = anchor + timedelta(hours=monitoring.report_frequency_hours)
                    if now > expected_next:
                        days_since_surgery = (now.date() - monitoring.surgery_date.date()).days + 1 if monitoring.surgery_date else None
                        days_since_release = (now.date() - monitoring.home_release_date.date()).days + 1
                        missing_list.append({
                            'id': monitoring.id,
                            'patient_name': monitoring.patient.name,
                            'patient_photo': monitoring.patient.photo_url,
                            'owner_name': monitoring.patient.owner.full_name,
                            'owner_phone': monitoring.patient.owner.phone_number,
                            'owner_email': monitoring.patient.owner.email,
                            'owner_identification_number': monitoring.patient.owner.identification_number,
                            'surgery_type': monitoring.surgery_type,
                            'surgery_date': monitoring.surgery_date.isoformat() if monitoring.surgery_date else None,
                            'home_release_date': monitoring.home_release_date.isoformat(),
                            'day_number': days_since_release,
                            'days_since_surgery': days_since_surgery,
                            'days_since_release': days_since_release,
                            'report_frequency_hours': monitoring.report_frequency_hours,
                            'last_report_at': last_report.submitted_at.isoformat() if last_report else None,
                            'expected_at': expected_next.isoformat(),
                            'minutes_overdue': int((now - expected_next).total_seconds() / 60),
                        })
                missing_list.sort(key=lambda x: x['minutes_overdue'], reverse=True)

                return {
                    'type': 'reports_update',
                    'count': pending_reports.count(),
                    'alert_count': high_risk.count(),
                    'missing_count': len(missing_list),
                    'reports': VetReportSerializer(sorted_reports[:20], many=True).data,
                    'missing_reports': missing_list[:20],
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
    clinic_ids = _selected_clinic_ids(request)

    pending_reports = Report.objects.filter(
        monitoring__patient__clinic_id__in=clinic_ids,
        review_status='PENDING'
    ).select_related(
        'monitoring',
        'monitoring__patient',
        'monitoring__patient__owner'
    )

    # Prioridad de riesgo (ALTO→MEDIO→BAJO→sin dato); dentro de cada nivel, lo
    # más reciente primero. Mismo orden que el stream SSE.
    high_risk = pending_reports.filter(calculated_risk='HIGH').order_by('-submitted_at')
    medium_risk = pending_reports.filter(calculated_risk='MEDIUM').order_by('-submitted_at')
    low_risk = pending_reports.filter(calculated_risk='LOW').order_by('-submitted_at')
    no_risk = pending_reports.filter(calculated_risk__isnull=True).order_by('-submitted_at')

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

    clinic_ids = _selected_clinic_ids(request)

    # Solo seguimientos ya dados de salida (en casa) y aún activos.
    active_monitorings = SurgicalMonitoring.objects.filter(
        patient__clinic_id__in=clinic_ids,
        status='ACTIVE',
        home_release_date__isnull=False
    ).select_related(
        'patient',
        'patient__owner'
    )

    missing_reports = []

    for monitoring in active_monitorings:
        last_report = monitoring.reports.order_by('-submitted_at').first()
        now = timezone.now()

        anchor = last_report.submitted_at if last_report else monitoring.home_release_date
        expected_next = anchor + timedelta(hours=monitoring.report_frequency_hours)

        if now > expected_next:
            days_since_surgery = (now.date() - monitoring.surgery_date.date()).days + 1 if monitoring.surgery_date else None
            days_since_release = (now.date() - monitoring.home_release_date.date()).days + 1

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
                'home_release_date': monitoring.home_release_date,
                'day_number': days_since_release,
                'days_since_surgery': days_since_surgery,
                'days_since_release': days_since_release,
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
