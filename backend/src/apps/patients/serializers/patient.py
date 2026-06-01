from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring


class SurgicalMonitoringSerializer(serializers.ModelSerializer):
    """Vista del seguimiento para el propietario: incluye cuándo toca el próximo
    reporte y si hay uno pendiente (vencido)."""
    last_report_at = serializers.SerializerMethodField()
    next_report_at = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = SurgicalMonitoring
        fields = (
            'id', 'surgery_type', 'surgery_date', 'home_release_date',
            'report_frequency_hours', 'status',
            'last_report_at', 'next_report_at', 'is_overdue',
        )

    def _scheduling(self, obj):
        """Solo aplica si el seguimiento está activo y la mascota ya salió de la clínica."""
        if obj.status != 'ACTIVE' or not obj.home_release_date:
            return None
        last = obj.reports.filter(is_active=True).order_by('-submitted_at').first()
        anchor = last.submitted_at if last else obj.home_release_date
        next_at = anchor + timedelta(hours=obj.report_frequency_hours)
        return {
            'last_report_at': last.submitted_at if last else None,
            'next_report_at': next_at,
            'is_overdue': timezone.now() > next_at,
        }

    def get_last_report_at(self, obj):
        s = self._scheduling(obj)
        return s['last_report_at'] if s else None

    def get_next_report_at(self, obj):
        s = self._scheduling(obj)
        return s['next_report_at'] if s else None

    def get_is_overdue(self, obj):
        s = self._scheduling(obj)
        return bool(s and s['is_overdue'])


class PatientListSerializer(serializers.ModelSerializer):
    monitorings = serializers.SerializerMethodField()
    clinic_id = serializers.IntegerField(source='clinic.id', read_only=True, allow_null=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True, allow_null=True)

    class Meta:
        model = Patient
        fields = (
            'id', 'name', 'species', 'breed',
            'birth_date', 'current_weight', 'photo_url',
            'clinic_id', 'clinic_name', 'monitorings'
        )

    def get_monitorings(self, obj):
        qs = obj.monitorings.filter(is_active=True).order_by('-surgery_date')
        return SurgicalMonitoringSerializer(qs, many=True).data