from django import forms
from django.db import models
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SurgicalMonitoring, GeneralQuestion, CustomQuestion, Report, Answer, VisualEvidence

@admin.register(SurgicalMonitoring)
class SurgicalMonitoringAdmin(ModelAdmin):
    list_display = ('surgery_type', 'patient', 'surgery_date', 'status')
    list_filter = ('status',)
    search_fields = ('surgery_type', 'patient__name')
    
    autocomplete_fields = ['patient']

    formfield_overrides = {
        models.DateTimeField: {'widget': forms.DateTimeInput(attrs={'type': 'datetime-local'})},
    }

@admin.register(GeneralQuestion)
class GeneralQuestionAdmin(ModelAdmin):
    list_display = ('text', 'associated_risk', 'is_active', 'instruction_text')
    list_filter = ('associated_risk', 'is_active')

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