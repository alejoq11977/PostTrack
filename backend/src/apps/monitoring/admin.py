from django import forms
from django.db import models
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import SurgicalMonitoring, GeneralQuestion, CustomQuestion, Report, Answer, VisualEvidence
from apps.patients.models import FactorWindowRisk

class SurgicalMonitoringAdminForm(forms.ModelForm):
    surgery_date = forms.SplitDateTimeField(
        widget=forms.SplitDateTimeWidget(
            date_attrs={'type': 'date'}, # Calendario nativo rápido
            time_attrs={'type': 'time'}  # Reloj nativo
        ),
        label="Fecha y Hora de la Cirugía"
    )

    class Meta:
        model = SurgicalMonitoring
        fields = '__all__'


@admin.register(SurgicalMonitoring)
class SurgicalMonitoringAdmin(ModelAdmin):
    form = SurgicalMonitoringAdminForm
    list_display = ('surgery_type', 'patient', 'surgery_date', 'status')
    list_filter = ('status',)
    search_fields = ('surgery_type', 'patient__name')
    
    autocomplete_fields = ['patient']


class FactorWindowRiskInline(TabularInline):
    """Riesgo de este factor en cada ventana temporal (editable desde la pregunta)."""
    model = FactorWindowRisk
    extra = 0
    fields = ('window', 'risk_level')
    autocomplete_fields = ['window']


@admin.register(GeneralQuestion)
class GeneralQuestionAdmin(ModelAdmin):
    list_display = ('text', 'factor', 'associated_risk', 'is_active')
    list_filter = ('associated_risk', 'is_active')
    search_fields = ('text', 'factor')
    list_editable = ('factor',)
    inlines = [FactorWindowRiskInline]

@admin.register(CustomQuestion)
class CustomQuestionAdmin(ModelAdmin):
    list_display = ('text', 'monitoring', 'is_active', 'instruction_text')
    search_fields = ('text', 'monitoring__patient__name')

@admin.register(Report)
class ReportAdmin(ModelAdmin):
    list_display = ('monitoring', 'submitted_at', 'calculated_risk', 'validated_risk', 'review_status')
    list_filter = ('review_status', 'calculated_risk', 'validated_risk')
    readonly_fields = ('submitted_at',)

@admin.register(Answer)
class AnswerAdmin(ModelAdmin):
    list_display = ('report', 'general_question', 'custom_question', 'value')

@admin.register(VisualEvidence)
class VisualEvidenceAdmin(ModelAdmin):
    list_display = ('report', 'image_url')