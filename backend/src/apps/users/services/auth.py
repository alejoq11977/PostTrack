# backend/src/apps/users/services/auth.py
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from firebase_admin import auth
from apps.users.models import User

class FirebaseAuthentication(BaseAuthentication):
    """
    Autenticación personalizada para DRF usando Firebase.
    Extrae el token del header 'Authorization: Bearer <token>'
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None 
            
        token = auth_header.split(' ')[1]
        
        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email')
        except Exception as e:
            raise AuthenticationFailed(f'Token de Firebase inválido o expirado: {str(e)}')

        if not uid or not email:
            raise AuthenticationFailed('El Token de Firebase no contiene UID o Email.')

        try:
            user = User.objects.get(firebase_uid=uid)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=email)
                user.firebase_uid = uid
                user.save(update_fields=['firebase_uid'])
            except User.DoesNotExist:
                raise AuthenticationFailed('Usuario no registrado en el sistema. Contacte a su clínica.')
        
        return (user, token)