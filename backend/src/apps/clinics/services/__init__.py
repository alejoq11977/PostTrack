from django.utils import timezone
from django.db.models import Q
from ..models import (
    Clinic, VetClinic, DataPolicy,
    DataAuthorization, DataTreatmentAcceptance, ClinicAuditLog
)


class ClinicService:
    @staticmethod
    def get_user_clinics(user):
        if user.role == 'ADMIN':
            return Clinic.objects.filter(is_active=True)

        if user.role == 'VETERINARIAN':
            return Clinic.objects.filter(
                vet_clinics__veterinarian=user,
                vet_clinics__is_active=True,
                is_active=True
            ).distinct()

        if user.role == 'OWNER':
            return Clinic.objects.filter(
                patients__owner=user,
                patients__is_active=True,
                is_active=True
            ).distinct()

        return Clinic.objects.none()

    @staticmethod
    def get_user_clinic_ids(user):
        return list(ClinicService.get_user_clinics(user).values_list('id', flat=True))


class VetClinicService:
    @staticmethod
    def link_vet_to_clinic(veterinarian, clinic, role='VETERINARIAN'):
        vet_clinic, created = VetClinic.objects.update_or_create(
            veterinarian=veterinarian,
            clinic=clinic,
            defaults={
                'role': role,
                'is_active': True,
                'unlinked_at': None
            }
        )
        return vet_clinic

    @staticmethod
    def unlink_vet_from_clinic(veterinarian, clinic):
        try:
            vet_clinic = VetClinic.objects.get(
                veterinarian=veterinarian,
                clinic=clinic,
                is_active=True
            )
            vet_clinic.unlink()
            return True
        except VetClinic.DoesNotExist:
            return False

    @staticmethod
    def is_vet_in_clinic(veterinarian, clinic):
        return VetClinic.objects.filter(
            veterinarian=veterinarian,
            clinic=clinic,
            is_active=True
        ).exists()


class DataTreatmentService:
    @staticmethod
    def get_pending_terms(user, clinic):
        acceptance = DataTreatmentAcceptance.objects.filter(
            user=user,
            clinic=clinic
        ).first()

        if not acceptance:
            return {
                'needs_acceptance': True,
                'policy': DataPolicy.objects.filter(clinic=clinic, is_active=True).first(),
                'authorization': DataAuthorization.objects.filter(clinic=clinic, is_active=True).first()
            }

        active_policy = DataPolicy.objects.filter(clinic=clinic, is_active=True).first()
        active_authorization = DataAuthorization.objects.filter(clinic=clinic, is_active=True).first()

        policy_needs_update = (
            active_policy and
            acceptance.policy_version != active_policy.version
        )
        authorization_needs_update = (
            active_authorization and
            acceptance.authorization_version != active_authorization.version
        )

        if policy_needs_update or authorization_needs_update:
            return {
                'needs_acceptance': True,
                'policy': active_policy if policy_needs_update else None,
                'authorization': active_authorization if authorization_needs_update else None
            }

        return {
            'needs_acceptance': False,
            'policy': active_policy,
            'authorization': active_authorization,
            'current_acceptance': acceptance
        }

    @staticmethod
    def get_all_pending_terms_for_user(user):
        clinics = ClinicService.get_user_clinics(user)
        pending = []

        for clinic in clinics:
            pending_info = DataTreatmentService.get_pending_terms(user, clinic)
            if pending_info['needs_acceptance']:
                pending.append({
                    'clinic': clinic,
                    **pending_info
                })

        return pending

    @staticmethod
    def accept_terms(user, clinic, ip_address, user_agent, policy=None, authorization=None):
        policy_version = policy.version if policy else None
        auth_version = authorization.version if authorization else None

        acceptance, created = DataTreatmentAcceptance.objects.update_or_create(
            user=user,
            clinic=clinic,
            defaults={
                'accepted_at': timezone.now(),
                'ip_address': ip_address,
                'user_agent': user_agent,
                'policy_version': policy_version,
                'authorization_version': auth_version
            }
        )

        ClinicAuditLogService.log(
            clinic=clinic,
            user=user,
            action='ACCEPT_TERMS',
            details={
                'policy_version': policy_version,
                'authorization_version': auth_version
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        return acceptance


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
