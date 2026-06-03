from ..models import ClinicAuditLog


class ClinicAuditLogService:
    @staticmethod
    def log(clinic, user, action, details=None, ip_address=None, user_agent=None):
        return ClinicAuditLog.objects.create(
            clinic=clinic,
            user=user,
            action=action,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def get_clinic_audit_logs(clinic, user=None, action=None, limit=100):
        queryset = ClinicAuditLog.objects.filter(clinic=clinic)

        if user:
            queryset = queryset.filter(user=user)
        if action:
            queryset = queryset.filter(action=action)

        return queryset[:limit]

    @staticmethod
    def get_user_audit_logs(user, clinic=None, limit=100):
        queryset = ClinicAuditLog.objects.filter(user=user)

        if clinic:
            queryset = queryset.filter(clinic=clinic)

        return queryset[:limit]
