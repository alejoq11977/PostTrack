from rest_framework import serializers
from apps.monitoring.models import GeneralQuestion, CustomQuestion, SurgicalMonitoring, Report, Answer, VisualEvidence

class GeneralQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralQuestion
        fields = ('id', 'text', 'instruction_text') 

class CustomQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomQuestion
        fields = ('id', 'text', 'instruction_text')

class MonitoringFormSerializer(serializers.ModelSerializer):
    """
    Este serializador agrupa la información de la cirugía y las preguntas personalizadas.
    """
    custom_questions = CustomQuestionSerializer(many=True, read_only=True)
    days_since_surgery = serializers.SerializerMethodField()

    class Meta:
        model = SurgicalMonitoring
        fields = ('id', 'surgery_type', 'surgery_date', 'custom_questions', 'days_since_surgery')

    def get_days_since_surgery(self, obj):
        from datetime import datetime
        if obj.surgery_date:
            delta = datetime.now().replace(tzinfo=obj.surgery_date.tzinfo) - obj.surgery_date
            return delta.days
        return 0

class VisualEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualEvidence
        fields = ('id', 'image_url', 'created_at')

class AnswerSerializer(serializers.ModelSerializer):
    # Traemos el texto de la pregunta (sea general o custom) para mostrarlo en el historial
    question_text = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ('id', 'question_text', 'value')

    def get_question_text(self, obj):
        if obj.general_question:
            return obj.general_question.text
        if obj.custom_question:
            return obj.custom_question.text
        return "Pregunta desconocida"

class ReportHistorySerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    evidences = VisualEvidenceSerializer(many=True, read_only=True)
    day_number = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = (
            'id', 'submitted_at', 'calculated_risk', 'validated_risk',
            'review_status', 'processing_status', 'medical_notes',
            'answers', 'evidences', 'day_number'
        )

    def get_day_number(self, obj):
        if obj.monitoring and obj.monitoring.surgery_date:
            delta = obj.submitted_at.replace(tzinfo=obj.monitoring.surgery_date.tzinfo) - obj.monitoring.surgery_date
            return delta.days + 1
        return 1