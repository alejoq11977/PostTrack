from django.db import models
from apps.core.models import AuditableModel


class Clinic(AuditableModel):
    name = models.CharField(max_length=200, verbose_name="Nombre de la Clínica")
    nit = models.CharField(max_length=20, unique=True, verbose_name="NIT")
    address = models.CharField(max_length=300, verbose_name="Dirección")
    email = models.EmailField(verbose_name="Correo electrónico")
    phone = models.CharField(max_length=20, verbose_name="Teléfono")

    class Meta:
        verbose_name = "Clínica"
        verbose_name_plural = "Clínicas"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.nit})"


class VetClinic(AuditableModel):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('VETERINARIAN', 'Veterinario'),
    ]

    veterinarian = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='vet_clinics',
        verbose_name="Veterinario"
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='vet_clinics',
        verbose_name="Clínica"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='VETERINARIAN')
    is_active = models.BooleanField(default=True, verbose_name="Vínculo activo")
    linked_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de vínculo")
    unlinked_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de desvinculación")

    class Meta:
        verbose_name = "Vínculo Veterinario-Clínica"
        verbose_name_plural = "Vínculos Veterinario-Clínica"
        unique_together = ['veterinarian', 'clinic']
        ordering = ['-linked_at']

    def __str__(self):
        status = "Activo" if self.is_active else "Inactivo"
        return f"{self.veterinarian.full_name} - {self.clinic.name} ({status})"

    def unlink(self):
        from django.utils import timezone
        self.is_active = False
        self.unlinked_at = timezone.now()
        self.save(update_fields=['is_active', 'unlinked_at'])


class DataPolicy(AuditableModel):
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='data_policies',
        verbose_name="Clínica"
    )
    version = models.CharField(max_length=20, verbose_name="Versión")
    content = models.TextField(verbose_name="Contenido de la Política")
    effective_date = models.DateField(verbose_name="Fecha de vigencia")
    is_active = models.BooleanField(default=False, verbose_name="Política activa")

    class Meta:
        verbose_name = "Política de Tratamiento de Datos"
        verbose_name_plural = "Políticas de Tratamiento de Datos"
        ordering = ['-effective_date']

    def save(self, *args, **kwargs):
        if self.is_active:
            DataPolicy.objects.filter(clinic=self.clinic, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Política {self.version} - {self.clinic.name} ({'activa' if self.is_active else 'inactiva'})"


class DataAuthorization(AuditableModel):
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name='data_authorizations',
        verbose_name="Clínica"
    )
    version = models.CharField(max_length=20, verbose_name="Versión")
    content = models.TextField(verbose_name="Contenido de la Autorización")
    effective_date = models.DateField(verbose_name="Fecha de vigencia")
    is_active = models.BooleanField(default=False, verbose_name="Autorización activa")

    class Meta:
        verbose_name = "Autorización de Tratamiento de Datos"
        verbose_name_plural = "Autorizaciones de Tratamiento de Datos"
        ordering = ['-effective_date']

    def save(self, *args, **kwargs):
        if self.is_active:
            DataAuthorization.objects.filter(clinic=self.clinic, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Autorización {self.version} - {self.clinic.name} ({'activa' if self.is_active else 'inactiva'})"


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
