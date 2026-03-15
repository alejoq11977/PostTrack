from django.db import models
from apps.core.models import AuditableModel

class RiskLevel(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'

class GeneralQuestion(AuditableModel):
    text = models.CharField(max_length=500)
    associated_risk = models.CharField(max_length=10, choices=RiskLevel.choices)

    class Meta:
        verbose_name = 'General Question'
        verbose_name_plural = 'General Questions'

    def __str__(self):
        return self.text

class CustomQuestion(AuditableModel):
    monitoring = models.ForeignKey('monitoring.SurgicalMonitoring', on_delete=models.CASCADE, related_name='custom_questions')
    text = models.CharField(max_length=500)

    class Meta:
        verbose_name = 'Custom Question'
        verbose_name_plural = 'Custom Questions'

    def __str__(self):
        return f"{self.text} (for {self.monitoring.patient.name})"