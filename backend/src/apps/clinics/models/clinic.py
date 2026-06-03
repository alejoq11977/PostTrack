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
