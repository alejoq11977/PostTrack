from firebase_admin import auth
from apps.users.models import User, UserRole
from apps.users.repositories.user import create_owner
import logging

logger = logging.getLogger(__name__)

def create_owner_from_vet(email, full_name, identification_number):
    temporal_password = str(identification_number).zfill(6)
    uid = None
    
    try:
        firebase_user = auth.create_user(email=email, password=temporal_password, display_name=full_name)
        uid = firebase_user.uid
    except auth.EmailAlreadyExistsError:
        firebase_user = auth.get_user_by_email(email)
        uid = firebase_user.uid

    owner = create_owner(email, full_name, identification_number, uid)
    return owner