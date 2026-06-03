from django.db import models
from apps.core.models import AuditableModel
from .clinic import Clinic


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
