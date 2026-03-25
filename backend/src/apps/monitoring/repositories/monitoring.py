from django.shortcuts import get_object_or_404
from apps.monitoring.models import SurgicalMonitoring, GeneralQuestion

def get_active_monitoring_for_owner(monitoring_id: int, owner):
    """
    Busca una cirugía activa asegurándose de que le pertenezca al dueño.
    Lanza un 404 si no la encuentra o si intentan espiar la de otro dueño.
    """
    return get_object_or_404(
        SurgicalMonitoring, 
        pk=monitoring_id, 
        patient__owner=owner, 
        status='ACTIVE', 
        is_active=True
    )

def get_active_general_questions():
    """
    Retorna todas las preguntas generales que están activas en el sistema.
    """
    return GeneralQuestion.objects.filter(is_active=True)