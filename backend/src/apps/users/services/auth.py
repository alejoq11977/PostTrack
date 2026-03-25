from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from firebase_admin import auth
from apps.users.repositories.user import get_user_by_firebase_uid, get_user_by_email, update_user_firebase_uid

class FirebaseAuthentication(BaseAuthentication):
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
            raise AuthenticationFailed(f'Token inválido: {str(e)}')

        user = get_user_by_firebase_uid(uid)
        
        if not user:
            user = get_user_by_email(email)
            if user:
                update_user_firebase_uid(user, uid)
            else:
                raise AuthenticationFailed('Usuario no registrado.')
        
        return (user, token)