from django import forms
from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Patient, RiskRule, RiskThreshold
from apps.core.services.imgbb import upload_image_to_imgbb
from apps.monitoring.models.questions import GeneralQuestion
import logging

logger = logging.getLogger(__name__)


class RiskRuleForm(forms.ModelForm):
    selected_questions = forms.MultipleChoiceField(
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Preguntas",
        help_text="Seleccione las preguntas que deben estar en SÍ para activar esta regla"
    )
    points_low = forms.IntegerField(
        initial=0, min_value=0, required=False,
        label="Puntos LOW",
        help_text="Puntos a sumar si la regla se activa"
    )
    points_medium = forms.IntegerField(
        initial=0, min_value=0, required=False,
        label="Puntos MEDIUM"
    )
    points_high = forms.IntegerField(
        initial=0, min_value=0, required=False,
        label="Puntos HIGH"
    )

    class Meta:
        model = RiskRule
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        questions = GeneralQuestion.objects.filter(is_active=True).order_by('id')
        self.fields['selected_questions'].choices = [
            (q.id, q.text[:80] + ('...' if len(q.text) > 80 else ''))
            for q in questions
        ]
        self.fields['selected_questions'].widget.attrs.update({
            'class': 'grid grid-cols-1 gap-2'
        })

        if self.instance and self.instance.pk:
            self.fields['selected_questions'].initial = self.instance.question_ids or []
            self.fields['points_low'].initial = self.instance.points.get('LOW', 0)
            self.fields['points_medium'].initial = self.instance.points.get('MEDIUM', 0)
            self.fields['points_high'].initial = self.instance.points.get('HIGH', 0)

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.question_ids = [int(x) for x in self.cleaned_data['selected_questions']]
        instance.points = {
            'LOW': self.cleaned_data.get('points_low', 0),
            'MEDIUM': self.cleaned_data.get('points_medium', 0),
            'HIGH': self.cleaned_data.get('points_high', 0),
        }
        if commit:
            instance.save()
        return instance


class PatientAdminForm(forms.ModelForm):
    image_upload = forms.ImageField(
        required=False,
        label="Subir foto desde la PC",
        help_text="Sube una imagen aquí. El sistema la enviará a ImgBB y llenará el campo 'photo_url' automáticamente."
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

    list_display = ('name', 'species', 'breed', 'owner', 'clinic', 'managed_by_display', 'birth_date', 'is_active')
    list_display_links = ('name',)
    list_filter = ('species', 'is_active', 'clinic', 'created_at')
    search_fields = ('name', 'owner__full_name', 'owner__email', 'owner__identification_number', 'breed')
    ordering = ('-created_at',)
    autocomplete_fields = ['owner', 'clinic']

    list_select_related = ('owner', 'clinic')

    fieldsets = (
        ('Identificación', {
            'fields': ('name', 'species', 'breed', 'birth_date')
        }),
        ('Propietario', {
            'fields': ('owner',)
        }),
        ('Clínica', {
            'fields': ('clinic',)
        }),
        ('Información Médica', {
            'fields': ('current_weight',)
        }),
        ('Fotografía', {
            'fields': ('photo_url', 'image_upload'),
            'description': "Puedes pegar una URL directa en 'photo_url', O subir una foto desde tu computadora usando 'image_upload'."
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )

    def managed_by_display(self, obj):
        if obj.owner and obj.owner.managed_by:
            return format_html(
                '<span class="text-sm">{}</span>',
                obj.owner.managed_by.full_name
            )
        return '-'
    managed_by_display.short_description = 'Gestionado por'
    managed_by_display.admin_order_field = 'owner__managed_by__full_name'

    def get_readonly_fields(self, request, obj=None):
        readonly = ['created_at', 'updated_at']
        return readonly

    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return queryset, use_distinct


@admin.register(RiskRule)
class RiskRuleAdmin(ModelAdmin):
    form = RiskRuleForm
    list_display = ('name', 'questions_summary', 'points_summary', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)

    fieldsets = (
        ('Información', {
            'fields': ('name', 'description')
        }),
        ('Configuración', {
            'fields': ('selected_questions', 'points_low', 'points_medium', 'points_high', 'is_active')
        }),
    )

    def questions_summary(self, obj):
        if not obj.question_ids:
            return '-'
        count = len(obj.question_ids)
        return f"{count} pregunta(s)"
    questions_summary.short_description = 'Preguntas'

    def points_summary(self, obj):
        if not obj.points:
            return '-'
        parts = [f"+{v} {k}" for k, v in obj.points.items() if v > 0]
        return ", ".join(parts) if parts else "Sin puntos"
    points_summary.short_description = 'Puntos'

    def get_readonly_fields(self, request, obj=None):
        return ['created_at', 'updated_at']


@admin.register(RiskThreshold)
class RiskThresholdAdmin(ModelAdmin):
    list_display = ('level', 'min_count', 'escalates_to', 'is_active', 'created_at')
    list_filter = ('level', 'escalates_to', 'is_active')
    search_fields = ('level',)
    ordering = ('-created_at', 'min_count')

    fieldsets = (
        ('Umbral', {
            'fields': ('level', 'min_count', 'escalates_to', 'is_active')
        }),
    )