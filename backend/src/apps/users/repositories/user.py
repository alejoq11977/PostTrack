from django.utils import timezone
from apps.users.models import User, UserRole

def get_user_by_firebase_uid(uid: str):
    return User.objects.filter(firebase_uid=uid).first()

def get_user_by_email(email: str):
    return User.objects.filter(email=email).first()

def update_user_firebase_uid(user: User, uid: str):
    user.firebase_uid = uid
    user.save(update_fields=['firebase_uid'])
    return user

def create_owner(email: str, full_name: str, identification_number: str, firebase_uid: str):
    """Crea un propietario inicial con clave inutilizable localmente."""
    owner = User.objects.create(
        email=email,
        full_name=full_name,
        identification_number=identification_number,
        role=UserRole.OWNER,
        firebase_uid=firebase_uid,
        password_changed=False
    )
    owner.set_unusable_password()
    owner.save()
    return owner

def complete_user_profile(user: User):
    """Marca la contraseña como cambiada y registra la fecha de la Ley 1581."""
    user.password_changed = True
    user.terms_accepted_at = timezone.now()
    user.save(update_fields=['password_changed', 'terms_accepted_at'])
    return user