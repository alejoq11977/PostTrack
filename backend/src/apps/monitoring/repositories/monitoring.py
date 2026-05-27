from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.monitoring.models import SurgicalMonitoring, GeneralQuestion

def get_active_monitoring_for_owner(monitoring_id: int, owner):
    """
    Busca un seguimiento sobre el que el dueño PUEDE reportar:
    - le pertenece,
    - sigue activo (no se ha dado de alta),
    - la mascota YA salió de la clínica a casa (home_release_date en el pasado).
    Lanza 404 en cualquier otro caso (antes de la salida o tras el alta).
    """
    return get_object_or_404(
        SurgicalMonitoring,
        pk=monitoring_id,
        patient__owner=owner,
        status='ACTIVE',
        is_active=True,
        home_release_date__lte=timezone.now(),
    )

def get_active_general_questions():
    """
    Retorna todas las preguntas generales que están activas en el sistema.
    """
    return GeneralQuestion.objects.filter(is_active=True)