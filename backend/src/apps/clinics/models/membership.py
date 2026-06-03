from django.db import models
from apps.core.models import AuditableModel
from apps.users.models.user import UserRole, IdentificationType
from .clinic import Clinic


class ClinicMembership(AuditableModel):
    """
    Vínculo entre un usuario y una clínica. Generaliza el antiguo VetClinic:
    aplica tanto a veterinarios como a propietarios. Guarda el perfil de la
    persona *por clínica* — cada clínica es Responsable independiente del
    tratamiento de esos datos (Ley 1581), por lo que no se comparten ni se
    cruzan entre clínicas.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='clinic_memberships',
        verbose_name="Usuario"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name="Clínica"
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.OWNER,
        verbose_name="Rol en la clínica"
    )

    # Perfil por clínica (copia propia de cada clínica)
    full_name = models.CharField(max_length=255, blank=True, default='', verbose_name="Nombre completo")
    identification_type = models.CharField(
        max_length=3,
        choices=IdentificationType.choices,
        blank=True,
        null=True,
        verbose_name="Tipo de identificación"
    )
    identification_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Número de identificación")
    phone_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Teléfono")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección")

    is_active = models.BooleanField(default=True, verbose_name="Vínculo activo")
    linked_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de vínculo")
    unlinked_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de desvinculación")

    class Meta:
        verbose_name = "Membresía de Clínica"
        verbose_name_plural = "Membresías de Clínica"
        ordering = ['-linked_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'clinic'], name='unique_user_per_clinic'),
            models.UniqueConstraint(
                fields=['clinic', 'identification_number'],
                name='unique_identification_per_clinic',
                condition=models.Q(identification_number__isnull=False),
            ),
        ]

    def __str__(self):
        status = "Activo" if self.is_active else "Inactivo"
        display = self.full_name or self.user.full_name
        return f"{display} ({self.role}) - {self.clinic.name} [{status}]"

    def unlink(self):
        from django.utils import timezone
        self.is_active = False
        self.unlinked_at = timezone.now()
        self.save(update_fields=['is_active', 'unlinked_at'])
