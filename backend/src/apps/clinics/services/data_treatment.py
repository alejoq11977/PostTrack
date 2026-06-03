from django.utils import timezone
from ..models import DataPolicy, DataAuthorization, DataTreatmentAcceptance
from .clinic import ClinicService
from .audit_log import ClinicAuditLogService


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
