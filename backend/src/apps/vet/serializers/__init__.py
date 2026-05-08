from rest_framework import serializers
from apps.users.models import User
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring, Report


class VetReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='monitoring.patient.name', read_only=True)
    patient_photo = serializers.URLField(source='monitoring.patient.photo_url', read_only=True)
    owner_name = serializers.CharField(source='monitoring.patient.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='monitoring.patient.owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='monitoring.patient.owner.email', read_only=True)
    surgery_type = serializers.CharField(source='monitoring.surgery_type', read_only=True)
    day_number = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'submitted_at', 'calculated_risk', 'validated_risk',
            'review_status', 'medical_notes', 'day_number',
            'patient_name', 'patient_photo', 'owner_name', 'owner_phone', 'owner_email',
            'surgery_type'
        ]

    def get_day_number(self, obj):
        if obj.monitoring and obj.monitoring.surgery_date:
            delta = obj.submitted_at.replace(tzinfo=obj.monitoring.surgery_date.tzinfo) - obj.monitoring.surgery_date
            return delta.days + 1
        return 1


class VetOwnerSerializer(serializers.ModelSerializer):
    patients_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'identification_number',
            'phone_number', 'address', 'patients_count', 'created_at'
        ]

    def get_patients_count(self, obj):
        return obj.patients.filter(is_active=True).count()


class VetPatientSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'species', 'breed', 'photo_url',
            'owner_name', 'owner_phone', 'owner_email'
        ]


class VetMonitoringSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    owner_name = serializers.CharField(source='patient.owner.full_name', read_only=True)
    active_reports = serializers.SerializerMethodField()

    class Meta:
        model = SurgicalMonitoring
        fields = [
            'id', 'surgery_type', 'surgery_date', 'report_frequency_hours',
            'status', 'patient_name', 'owner_name', 'active_reports'
        ]

    def get_active_reports(self, obj):
        return obj.reports.filter(review_status='PENDING').count()


class VetMonitoringCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = SurgicalMonitoring
        fields = ['id', 'patient_id', 'surgery_type', 'surgery_date', 'report_frequency_hours', 'status']

    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id')
        patient = Patient.objects.get(id=patient_id)
        return SurgicalMonitoring.objects.create(patient=patient, **validated_data)