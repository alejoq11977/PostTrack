import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class ClinicAccessMiddleware:
    """
    Middleware that enforces clinic-level access control for /api/vet/* endpoints.

    Security measures:
    1. Validates X-Clinic-Id header against user's accessible clinics
    2. Logs all access attempts (authorized and denied)
    3. Returns 403 for any clinic access violation
    """

    EXEMPT_PATHS = [
        '/api/vet/alerts/stream/',  # SSE endpoint handles its own auth
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if not path.startswith('/api/vet/'):
            return self.get_response(request)

        if any(path.startswith(exempt) for exempt in self.EXEMPT_PATHS):
            return self.get_response(request)

        if not self._is_authenticated(request):
            return self.get_response(request)

        if getattr(request.user, 'is_anonymous', False):
            return self.get_response(request)

        clinic_id_header = request.headers.get('X-Clinic-Id')

        if not clinic_id_header:
            logger.warning(
                f"Clinic access denied - No X-Clinic-Id header | "
                f"User: {request.user} | Path: {path} | IP: {self._get_client_ip(request)}"
            )
            return JsonResponse(
                {'error': 'Clinic selection required', 'code': 'CLINIC_SELECTION_REQUIRED'},
                status=403
            )

        try:
            clinic_id = int(clinic_id_header)
        except (ValueError, TypeError):
            logger.warning(
                f"Clinic access denied - Invalid clinic ID format | "
                f"User: {request.user} | X-Clinic-Id: {clinic_id_header} | Path: {path}"
            )
            return JsonResponse(
                {'error': 'Invalid clinic ID', 'code': 'INVALID_CLINIC_ID'},
                status=403
            )

        user_clinic_ids = self._get_user_clinic_ids(request.user)

        if not user_clinic_ids:
            logger.warning(
                f"Clinic access denied - User has no active clinics | "
                f"User: {request.user} | Path: {path} | IP: {self._get_client_ip(request)}"
            )
            return JsonResponse(
                {'error': 'No clinics assigned', 'code': 'NO_CLINICS_ASSIGNED'},
                status=403
            )

        if clinic_id not in user_clinic_ids:
            logger.warning(
                f"Clinic access denied - Access to unauthorized clinic | "
                f"User: {request.user} | AttemptedClinicId: {clinic_id} | "
                f"UserClinics: {user_clinic_ids} | Path: {path} | "
                f"IP: {self._get_client_ip(request)}"
            )
            return JsonResponse(
                {'error': 'Access denied to this clinic', 'code': 'CLINIC_ACCESS_DENIED'},
                status=403
            )

        request.clinic_id = clinic_id

        logger.info(
            f"Clinic access granted | "
            f"User: {request.user} | ClinicId: {clinic_id} | Path: {path}"
        )

        return self.get_response(request)

    def _get_user_clinic_ids(self, user):
        if not user.is_authenticated:
            return []

        from apps.clinics.models import VetClinic
        try:
            return list(VetClinic.objects.filter(
                veterinarian=user,
                is_active=True
            ).values_list('clinic_id', flat=True))
        except Exception as e:
            logger.error(f"Error fetching user clinic IDs: {e}")
            return []

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def _is_authenticated(self, request):
        return (
            hasattr(request, 'user') and
            request.user and
            hasattr(request.user, 'is_authenticated') and
            bool(request.user.is_authenticated)
        )