# backend/src/apps/patients/admin.py
from django import forms
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Patient
from apps.core.services.imgbb import upload_image_to_imgbb
import logging

logger = logging.getLogger(__name__)

class PatientAdminForm(forms.ModelForm):
    image_upload = forms.ImageField(
        required=False, 
        label="Subir foto desde la PC",
        help_text="Sube una imagen aquí. El sistema la enviará a ImgBB y llenará el campo 'Photo url' automáticamente."
    )

    class Meta:
        model = Patient
        fields = '__all__'
        widgets = {
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def save(self, commit=True):
        instance = super().save(commit=False)
        image_file = self.cleaned_data.get('image_upload')
        
        if image_file:
            logger.info(f"Subiendo foto de {instance.name} a ImgBB desde el Admin...")
            url = upload_image_to_imgbb(image_file)
            if url:
                instance.photo_url = url
                logger.info(f"Foto de {instance.name} guardada: {url}")

        if commit:
            instance.save()
        return instance

@admin.register(Patient)
class PatientAdmin(ModelAdmin):
    form = PatientAdminForm

    list_display = ('name', 'species', 'breed', 'owner', 'clinic', 'birth_date', 'photo_url')
    list_filter = ('species', 'is_active', 'clinic')
    search_fields = ('name', 'owner__full_name', 'owner__email')
    ordering = ('-created_at',)

    autocomplete_fields = ['owner', 'clinic']

    fieldsets = (
        ('Propietario', {
            'fields': ('owner',)
        }),
        ('Clínica', {
            'fields': ('clinic',)
        }),
        ('Datos del Paciente', {
            'fields': ('name', 'species', 'breed', 'birth_date', 'current_weight')
        }),
        ('Fotografía (Elige una opción)', {
            'fields': ('image_upload', 'photo_url'),
            'description': "Puedes pegar una URL directa en 'Photo url', O subir una foto desde tu computadora usando 'Subir foto desde la PC'."
        }),
        ('Auditoría', {
            'fields': ('is_active',),
            'classes': ('collapse',)
        }),
    )