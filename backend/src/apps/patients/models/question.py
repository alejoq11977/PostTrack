from django.db import models
from apps.core.models import AuditableModel
from apps.monitoring.models.questions import RiskLevel


class RiskWindow(AuditableModel):
    """
    Ventana temporal post-operatoria (medida desde la CIRUGÍA). El riesgo de
    cada factor cambia según la ventana en la que cae el reporte.
    La ventana aplica desde `start_hour` (inclusive) hasta el inicio de la siguiente.
    """
    label = models.CharField(max_length=100, help_text="Ej: 'Ventana 1 (0-48h)'")
    start_hour = models.IntegerField(
        help_text="Hora de inicio (inclusive) desde la cirugía."
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Ventana de Riesgo'
        verbose_name_plural = 'Ventanas de Riesgo'
        ordering = ['start_hour']

    def __str__(self):
        return f"{self.label} (≥ {self.start_hour}h)"


class RiskRule(AuditableModel):
    """
    Combinación específica: si TODAS las preguntas indicadas están en 'Sí',
    el riesgo determinado por esta regla es `result_level`.
    Las combinaciones con 'O' se modelan como varias reglas independientes.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, help_text="Descripción de la regla")
    question_ids = models.JSONField(
        default=list,
        help_text="IDs de preguntas GeneralQuestion que deben estar TODAS en SÍ"
    )
    result_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.HIGH,
        help_text="Nivel de riesgo que determina esta combinación"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Combinación de Riesgo'
        verbose_name_plural = 'Combinaciones de Riesgo'

    def __str__(self):
        return self.name


class RiskThreshold(AuditableModel):
    """
    Umbral de escalamiento: si hay `min_count` o más factores en `level`,
    el riesgo escala a `escalates_to`.
    """
    level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        help_text="Nivel de riesgo base"
    )
    min_count = models.IntegerField(
        help_text="Cantidad mínima de factores para activar el escalamiento"
    )
    escalates_to = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        help_text="Nivel al que se escala"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Umbral de Riesgo'
        verbose_name_plural = 'Umbrales de Riesgo'
        ordering = ['min_count']

    def __str__(self):
        return f"{self.min_count}+ {self.level} → {self.escalates_to}"


class FactorWindowRisk(AuditableModel):
    """Riesgo de un factor (pregunta) dentro de una ventana temporal."""
    question = models.ForeignKey(
        'monitoring.GeneralQuestion',
        on_delete=models.CASCADE,
        related_name='window_risks',
        verbose_name="Factor (pregunta)"
    )
    window = models.ForeignKey(
        RiskWindow,
        on_delete=models.CASCADE,
        related_name='factor_risks',
        verbose_name="Ventana"
    )
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, verbose_name="Nivel de riesgo")

    class Meta:
        verbose_name = 'Riesgo por Ventana'
        verbose_name_plural = 'Riesgos por Ventana'
        unique_together = ['question', 'window']
        ordering = ['window__start_hour']

    def __str__(self):
        return f"{self.question_id} @ {self.window.label}: {self.risk_level}"
