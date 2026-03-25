from apps.patients.models import Patient

def get_active_patients_by_owner(owner):
    """
    Retorna la lista de pacientes activos que le pertenecen a un dueño específico,
    ordenados por los más recientes primero.
    """
    return Patient.objects.filter(
        owner=owner, 
        is_active=True
    ).order_by('-created_at')