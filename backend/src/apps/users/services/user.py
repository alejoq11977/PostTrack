from firebase_admin import auth
from apps.users.models import User, UserRole
import logging

logger = logging.getLogger(__name__)

def create_owner_from_vet(email, full_name, identification_number, phone_number=None, address=None):
    """
    Servicio exclusivo para el CU-04: El veterinario crea un propietario.
    Usa la identificación como contraseña temporal en Firebase.
    """
    temporal_password = str(identification_number)
    if len(temporal_password) < 6:
        temporal_password = temporal_password.zfill(6)

    uid = None
    try:
        firebase_user = auth.create_user(
            email=email,
            password=temporal_password,
            display_name=full_name,
        )
        uid = firebase_user.uid
        logger.info(f"Owner creado en Firebase: {email}")
    except auth.EmailAlreadyExistsError:
        firebase_user = auth.get_user_by_email(email)
        uid = firebase_user.uid
        logger.warning(f"El email {email} ya existía en Firebase.")

    owner = User.objects.create(
        email=email,
        full_name=full_name,
        identification_number=identification_number,
        phone_number=phone_number, 
        address=address,           
        role=UserRole.OWNER,
        firebase_uid=uid,
        password_changed=False
    )
    
    owner.set_unusable_password()
    owner.save()

    return owner