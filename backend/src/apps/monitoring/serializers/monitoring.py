from rest_framework import serializers
from apps.monitoring.models import GeneralQuestion, CustomQuestion, SurgicalMonitoring

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

    class Meta:
        model = SurgicalMonitoring
        fields = ('id', 'surgery_type', 'surgery_date', 'custom_questions')