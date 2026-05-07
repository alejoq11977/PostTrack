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


def get_active_patients_by_owner_and_clinic(owner, clinic_id):
    """
    Retorna la lista de pacientes activos que le pertenecen a un dueño específico
    y que están asociados a una clínica específica.
    """
    return Patient.objects.filter(
        owner=owner,
        clinic_id=clinic_id,
        is_active=True
    ).order_by('-created_at')