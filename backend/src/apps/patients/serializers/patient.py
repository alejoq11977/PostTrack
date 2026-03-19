from rest_framework import serializers
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring

class SurgicalMonitoringSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurgicalMonitoring
        fields = ('id', 'surgery_type', 'surgery_date', 'report_frequency_hours', 'status')

class PatientListSerializer(serializers.ModelSerializer):
    monitorings = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = (
            'id', 'name', 'species', 'breed', 
            'birth_date', 'current_weight', 'photo_url', 'monitorings'
        )

    def get_monitorings(self, obj):
        qs = obj.monitorings.filter(is_active=True).order_by('-surgery_date')
        return SurgicalMonitoringSerializer(qs, many=True).data