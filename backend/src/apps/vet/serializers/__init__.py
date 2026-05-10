from rest_framework import serializers
from apps.users.models import User
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring, Report


class AnswerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    question_text = serializers.CharField()
    value = serializers.CharField()

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

class VetReportDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='monitoring.patient.name', read_only=True)
    patient_photo = serializers.URLField(source='monitoring.patient.photo_url', read_only=True)
    owner_name = serializers.CharField(source='monitoring.patient.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='monitoring.patient.owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='monitoring.patient.owner.email', read_only=True)
    surgery_type = serializers.CharField(source='monitoring.surgery_type', read_only=True)
    day_number = serializers.SerializerMethodField()
    general_questions = serializers.SerializerMethodField()
    custom_questions = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    general_notes = serializers.SerializerMethodField()
    evidences = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'submitted_at', 'calculated_risk', 'validated_risk',
            'review_status', 'medical_notes', 'day_number',
            'patient_name', 'patient_photo', 'owner_name', 'owner_phone', 'owner_email',
            'surgery_type', 'general_questions', 'custom_questions', 'answers', 'general_notes',
            'evidences'
        ]

    def get_day_number(self, obj):
        if obj.monitoring and obj.monitoring.surgery_date:
            delta = obj.submitted_at.replace(tzinfo=obj.monitoring.surgery_date.tzinfo) - obj.monitoring.surgery_date
            return delta.days + 1
        return 1

    def get_general_questions(self, obj):
        from apps.monitoring.models import GeneralQuestion
        questions = GeneralQuestion.objects.filter(is_active=True)
        return [{'id': q.id, 'text': q.text, 'instruction_text': q.instruction_text} for q in questions]

    def get_custom_questions(self, obj):
        if obj.monitoring:
            return [
                {'id': q.id, 'text': q.text, 'instruction_text': q.instruction_text}
                for q in obj.monitoring.custom_questions.filter(is_active=True)
            ]
        return []

    def get_answers(self, obj):
        answers = obj.answers.select_related('general_question', 'custom_question').all()
        result = []
        for a in answers:
            question_text = None
            if a.general_question:
                question_text = a.general_question.text
            elif a.custom_question:
                question_text = a.custom_question.text
            result.append({
                'id': a.id,
                'question_text': question_text or 'Pregunta desconocida',
                'value': a.value
            })
        return result

    def get_general_notes(self, obj):
        return obj.medical_notes or ''

    def get_evidences(self, obj):
        evidences = obj.evidences.all()
        return [
            {'id': e.id, 'image_url': e.image_url, 'created_at': e.created_at}
            for e in evidences
        ]


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


class VetOwnerCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'full_name', 'email', 'password', 'confirm_password',
            'identification_number', 'phone_number', 'address'
        ]

    def validate(self, attrs):
        if 'confirm_password' in attrs and attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = 'OWNER'
        user.save()
        return user


class VetPatientSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'species', 'breed', 'birth_date', 'current_weight', 'photo_url',
            'owner_name', 'owner_phone', 'owner_email'
        ]


class VetPatientCreateSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Patient
        fields = ['name', 'species', 'breed', 'birth_date', 'current_weight', 'photo_url', 'owner_id']

    def create(self, validated_data):
        from apps.clinics.models import VetClinic
        owner_id = validated_data.pop('owner_id', None)
        clinic = None
        if owner_id:
            owner = User.objects.get(id=owner_id)
            vet_clinic = VetClinic.objects.filter(veterinarian=self.context['request'].user, is_active=True).first()
            if vet_clinic:
                clinic = vet_clinic.clinic
            return Patient.objects.create(owner=owner, clinic=clinic, **validated_data)
        return Patient.objects.create(**validated_data)


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