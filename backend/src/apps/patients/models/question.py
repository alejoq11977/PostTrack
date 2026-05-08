from django.db import models
from apps.core.models import AuditableModel
from apps.monitoring.models.questions import RiskLevel


class RiskRule(AuditableModel):
    """
    Regla específica: combinación de preguntas que al estar TODAS en SÍ
    suman puntos al conteo de riesgo.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Descripción de la regla")
    question_ids = models.JSONField(
        default=list,
        help_text="Lista de IDs de preguntas GeneralQuestion que deben estar en SÍ"
    )
    points = models.JSONField(
        default=dict,
        help_text='Puntos a sumar por nivel: {"LOW": 0, "MEDIUM": 1, "HIGH": 0}'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Risk Rule'
        verbose_name_plural = 'Risk Rules'

    def __str__(self):
        return self.name


class RiskThreshold(AuditableModel):
    """
    Umbral de escalamiento: cantidad mínima de respuestas en un nivel
    que provoca que el riesgo escale a otro nivel.
    """
    level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        help_text="Nivel de riesgo base"
    )
    min_count = models.IntegerField(
        help_text="Cantidad mínima de respuestas para activar el escalamiento"
    )
    escalates_to = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        help_text="Nivel al que se escala"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Risk Threshold'
        verbose_name_plural = 'Risk Thresholds'
        ordering = ['min_count']

    def __str__(self):
        return f"{self.min_count}+ {self.level} → {self.escalates_to}"