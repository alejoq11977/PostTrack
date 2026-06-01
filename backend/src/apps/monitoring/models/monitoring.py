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
    # Control anti-spam de los recordatorios al propietario cuando hay un reporte vencido.
    # Se resetean (a None / 0) cuando el propietario envía un reporte nuevo.
    last_overdue_email_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Última vez que se envió correo por reporte vencido (anti-spam: 24h entre correos).",
    )
    overdue_emails_sent = models.IntegerField(
        default=0,
        help_text="Cuántos correos de recordatorio se han enviado este ciclo (tope: 3).",
    )

    class Meta:
        verbose_name = 'Surgical Monitoring'
        verbose_name_plural = 'Surgical Monitorings'

    def __str__(self):
        return f"{self.surgery_type} - {self.patient.name}"