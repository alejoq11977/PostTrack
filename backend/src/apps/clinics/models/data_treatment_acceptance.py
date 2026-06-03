from django.db import models
from apps.core.models import AuditableModel
from .clinic import Clinic


class DataTreatmentAcceptance(AuditableModel):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='data_acceptances',
        verbose_name="Usuario"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='data_acceptances',
        verbose_name="Clínica"
    )
    accepted_at = models.DateTimeField(verbose_name="Fecha de aceptación")
    ip_address = models.GenericIPAddressField(verbose_name="Dirección IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    policy_version = models.CharField(max_length=20, verbose_name="Versión de Política aceptada")
    authorization_version = models.CharField(max_length=20, verbose_name="Versión de Autorización aceptada")

    class Meta:
        verbose_name = "Aceptación de Tratamiento de Datos"
        verbose_name_plural = "Aceptaciones de Tratamiento de Datos"
        unique_together = ['user', 'clinic']
        ordering = ['-accepted_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.clinic.name} ({self.accepted_at.strftime('%Y-%m-%d %H:%M')})"
