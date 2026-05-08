from django.db import models
from apps.core.models import AuditableModel
from simple_history.models import HistoricalRecords
from .questions import RiskLevel

class ProcessingStatus(models.TextChoices):
    PROCESSING = 'PROCESSING', 'Processing Images'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'

class ReportStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    REVIEWED = 'REVIEWED', 'Reviewed'

class Report(AuditableModel):
    monitoring = models.ForeignKey('monitoring.SurgicalMonitoring', on_delete=models.CASCADE, related_name='reports')
    submitted_at = models.DateTimeField(auto_now_add=True)
    calculated_risk = models.CharField(max_length=10, choices=RiskLevel.choices, blank=True, null=True)
    validated_risk = models.CharField(max_length=10, choices=RiskLevel.choices, blank=True, null=True)
    review_status = models.CharField(max_length=15, choices=ReportStatus.choices, default=ReportStatus.PENDING)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    processing_status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.COMPLETED)
    medical_notes = models.TextField(blank=True, null=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'

    def __str__(self):
        return f"Report for {self.monitoring.patient.name} at {self.submitted_at.strftime('%Y-%m-%d')}"

class Answer(AuditableModel):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='answers')
    general_question = models.ForeignKey('monitoring.GeneralQuestion', on_delete=models.SET_NULL, null=True, blank=True)
    custom_question = models.ForeignKey('monitoring.CustomQuestion', on_delete=models.SET_NULL, null=True, blank=True)
    value = models.TextField(help_text="Response from the owner (Yes/No or text)")

    class Meta:
        verbose_name = 'Answer'
        verbose_name_plural = 'Answers'

    def __str__(self):
        return f"Answer for Report {self.report.id}"

class VisualEvidence(AuditableModel):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='evidences')
    image_url = models.URLField(max_length=500, help_text="URL from ImgBB")

    class Meta:
        verbose_name = 'Visual Evidence'
        verbose_name_plural = 'Visual Evidences'

    def __str__(self):
        return f"Evidence for Report {self.report.id}"