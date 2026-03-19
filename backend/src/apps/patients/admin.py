# backend/src/apps/patients/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(ModelAdmin):
    list_display = ('name', 'species', 'breed', 'owner', 'birth_date', 'photo_url')
    list_filter = ('species', 'is_active')
    search_fields = ('name', 'owner__full_name', 'owner__email')
    ordering = ('-created_at',)