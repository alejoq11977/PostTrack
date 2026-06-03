from rest_framework import serializers
from apps.monitoring.models import Report


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
        """
        Respuestas enriquecidas con el riesgo clínico real de cada factor en la
        ventana temporal del reporte (no por Sí/No, que sería incorrecto). Permite
        al frontend resaltar las señales de alerta y ordenarlas por gravedad.
        """
        from apps.patients.services.risk_evaluation import _resolve_window
        from apps.patients.models import FactorWindowRisk

        # Ventana del reporte, medida desde la cirugía.
        window = None
        if obj.monitoring and obj.monitoring.surgery_date:
            hours = (obj.submitted_at - obj.monitoring.surgery_date).total_seconds() / 3600
            window = _resolve_window(hours)

        risk_by_question = {}
        if window:
            for fwr in FactorWindowRisk.objects.filter(window=window):
                risk_by_question[fwr.question_id] = fwr.risk_level

        severity = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, None: 0}

        answers = obj.answers.select_related('general_question', 'custom_question').all()
        result = []
        for a in answers:
            if a.general_question:
                qtype = 'general'
                question_text = a.general_question.text
                instruction = a.general_question.instruction_text
                # "Presente" = el dueño respondió que sí ocurre el signo.
                present = str(a.value).strip().lower() in ('yes', 'true', 'sí', 'si', '1')
                if present:
                    risk_level = risk_by_question.get(
                        a.general_question_id,
                        a.general_question.associated_risk or None,
                    )
                else:
                    risk_level = None
            elif a.custom_question:
                qtype = 'custom'
                question_text = a.custom_question.text
                instruction = a.custom_question.instruction_text
                present = None
                risk_level = None
            else:
                qtype = 'general'
                question_text = 'Pregunta desconocida'
                instruction = None
                present = None
                risk_level = None

            result.append({
                'id': a.id,
                'type': qtype,
                'question_text': question_text or 'Pregunta desconocida',
                'instruction_text': instruction,
                'value': a.value,
                'present': present,
                'risk_level': risk_level,
            })

        # Generales primero (las señales clínicas) ordenadas por gravedad; custom al final.
        result.sort(key=lambda r: (
            0 if r['type'] == 'general' else 1,
            -severity.get(r['risk_level'], 0),
        ))
        return result

    def get_general_notes(self, obj):
        return obj.medical_notes or ''

    def get_evidences(self, obj):
        evidences = obj.evidences.all()
        return [
            {'id': e.id, 'image_url': e.image_url, 'created_at': e.created_at}
            for e in evidences
        ]
