from rest_framework import serializers
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring, CustomQuestion


class VetMonitoringSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    owner_name = serializers.CharField(source='patient.owner.full_name', read_only=True)
    owner_email = serializers.EmailField(source='patient.owner.email', read_only=True)
    owner_identification_number = serializers.CharField(source='patient.owner.identification_number', read_only=True)
    active_reports = serializers.SerializerMethodField()
    days_since_surgery = serializers.SerializerMethodField()
    days_since_release = serializers.SerializerMethodField()

    class Meta:
        model = SurgicalMonitoring
        fields = [
            'id', 'surgery_type', 'surgery_date', 'home_release_date', 'discharged_at',
            'report_frequency_hours', 'status', 'patient_name', 'owner_name', 'owner_email',
            'owner_identification_number', 'active_reports', 'days_since_surgery', 'days_since_release'
        ]

    def get_active_reports(self, obj):
        return obj.reports.filter(review_status='PENDING').count()

    def get_days_since_surgery(self, obj):
        if not obj.surgery_date:
            return None
        from django.utils import timezone
        return (timezone.now().date() - obj.surgery_date.date()).days

    def get_days_since_release(self, obj):
        if not obj.home_release_date:
            return None
        from django.utils import timezone
        return (timezone.now().date() - obj.home_release_date.date()).days


class CustomQuestionInputSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=500)
    instruction_text = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default=''
    )


class VetMonitoringCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True)
    report_frequency_hours = serializers.IntegerField(
        min_value=1,
        error_messages={
            'min_value': 'La frecuencia debe ser de al menos 1 hora.',
            'invalid': 'Ingrese un número válido de horas.',
        },
    )
    # Preguntas personalizadas que el propietario responderá en cada reporte.
    custom_questions = CustomQuestionInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = SurgicalMonitoring
        fields = ['id', 'patient_id', 'surgery_type', 'surgery_date', 'home_release_date',
                  'report_frequency_hours', 'status', 'custom_questions']

    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id')
        custom_questions = validated_data.pop('custom_questions', [])
        patient = Patient.objects.get(id=patient_id)
        monitoring = SurgicalMonitoring.objects.create(patient=patient, **validated_data)
        for cq in custom_questions:
            text = (cq.get('text') or '').strip()
            if not text:
                continue
            CustomQuestion.objects.create(
                monitoring=monitoring,
                text=text,
                instruction_text=(cq.get('instruction_text') or '').strip(),
            )
        return monitoring