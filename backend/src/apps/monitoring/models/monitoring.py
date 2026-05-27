from django.db import models
from apps.core.models import AuditableModel

class MonitoringStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    DISCHARGED = 'DISCHARGED', 'Discharged'

class SurgicalMonitoring(AuditableModel):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='monitorings')
    surgery_type = models.CharField(max_length=255)
    surgery_date = models.DateTimeField(help_text="Fecha/hora de la cirugía. Define las ventanas de riesgo.")
    home_release_date = models.DateTimeField(
        null=True, blank=True,
        help_text="Salida de la clínica a casa. Inicia el agendamiento de reportes del dueño."
    )
    discharged_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Fecha/hora en que se dio de alta (se finalizó el seguimiento)."
    )
    report_frequency_hours = models.IntegerField(default=24, help_text="Frequency of reports in hours")
    status = models.CharField(max_length=20, choices=MonitoringStatus.choices, default=MonitoringStatus.ACTIVE)

    class Meta:
        verbose_name = 'Surgical Monitoring'
        verbose_name_plural = 'Surgical Monitorings'

    def __str__(self):
        return f"{self.surgery_type} - {self.patient.name}"