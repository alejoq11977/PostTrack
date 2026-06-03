from django.db import models
from apps.core.models import AuditableModel
from .clinic import Clinic


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
