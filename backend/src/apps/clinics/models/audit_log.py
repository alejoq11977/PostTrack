from django.db import models
from apps.core.models import AuditableModel
from .clinic import Clinic


class ClinicAuditLog(AuditableModel):
    ACTION_CHOICES = [
        ('LOGIN', 'Inicio de sesión'),
        ('LOGOUT', 'Cierre de sesión'),
        ('SELECT_CLINIC', 'Selección de clínica'),
        ('CREATE_PATIENT', 'Crear mascota'),
        ('UPDATE_PATIENT', 'Actualizar mascota'),
        ('VIEW_PATIENT', 'Ver mascota'),
        ('CREATE_MONITORING', 'Crear seguimiento'),
        ('SUBMIT_REPORT', 'Enviar reporte'),
        ('UPDATE_PROFILE', 'Actualizar perfil'),
    ]

    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        verbose_name="Clínica"
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='clinic_audit_logs',
        verbose_name="Usuario"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, verbose_name="Acción")
    details = models.JSONField(default=dict, blank=True, verbose_name="Detalles adicionales")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Dirección IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Timestamp")

    class Meta:
        verbose_name = "Log de Auditoría de Clínica"
        verbose_name_plural = "Logs de Auditoría de Clínica"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.full_name} - {self.action} en {self.clinic.name} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"
