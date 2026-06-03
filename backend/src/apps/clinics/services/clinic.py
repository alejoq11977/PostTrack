from ..models import Clinic, ClinicMembership


class ClinicService:
    @staticmethod
    def get_user_clinics(user):
        if user.role == 'ADMIN':
            return Clinic.objects.filter(is_active=True)

        if user.role == 'VETERINARIAN':
            return Clinic.objects.filter(
                memberships__user=user,
                memberships__is_active=True,
                is_active=True
            ).distinct()

        if user.role == 'OWNER':
            return Clinic.objects.filter(
                memberships__user=user,
                memberships__is_active=True,
                is_active=True
            ).distinct()

        return Clinic.objects.none()

    @staticmethod
    def get_user_clinic_ids(user):
        return list(ClinicService.get_user_clinics(user).values_list('id', flat=True))


class VetClinicService:
    @staticmethod
    def link_vet_to_clinic(veterinarian, clinic):
        vet_clinic, created = ClinicMembership.objects.update_or_create(
            user=veterinarian,
            clinic=clinic,
            defaults={
                'is_active': True,
                'unlinked_at': None,
                'role': 'VETERINARIAN',
            }
        )
        return vet_clinic

    @staticmethod
    def unlink_vet_from_clinic(veterinarian, clinic):
        try:
            vet_clinic = ClinicMembership.objects.get(
                user=veterinarian,
                clinic=clinic,
                is_active=True
            )
            vet_clinic.unlink()
            return True
        except ClinicMembership.DoesNotExist:
            return False

    @staticmethod
    def is_vet_in_clinic(veterinarian, clinic):
        return ClinicMembership.objects.filter(
            user=veterinarian,
            clinic=clinic,
            is_active=True
        ).exists()
