# backend/src/apps/users/services/firebase.py
import os
import firebase_admin
from firebase_admin import credentials
from django.conf import settings
import logging
from apps.users.models import User

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Inicializa la app de Firebase usando el archivo JSON de credenciales."""
    if not firebase_admin._apps:
        cred_path = os.path.join(settings.BASE_DIR, 'config', 'firebase-credentials.json')
        
        if os.path.exists(cred_path):
            try:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK inicializado correctamente.")
            except Exception as e:
                logger.error(f"Error inicializando Firebase: {e}")
        else:
            logger.warning("Archivo firebase-credentials.json no encontrado. Firebase Auth fallará.")



def sync_user_with_firebase(user_instance):
    """
    Crea el usuario en Firebase usando su email y número de identificación
    como contraseña temporal (Caso de Uso CU-04).
    """
    if user_instance.firebase_uid or not user_instance.email or not user_instance.identification_number:
        logger.warning(f"No se puede sincronizar a {user_instance.email}: Faltan datos o ya está sincronizado.")
        return

    try:
        temporal_password = str(user_instance.identification_number)
        if len(temporal_password) < 6:
            temporal_password = temporal_password.zfill(6) 

        try:
            firebase_user = auth.create_user(
                email=user_instance.email,
                password=temporal_password,
                display_name=user_instance.full_name,
            )
            uid = firebase_user.uid
            logger.info(f"Usuario {user_instance.email} creado exitosamente en Firebase Auth.")
            
        except auth.EmailAlreadyExistsError:
            firebase_user = auth.get_user_by_email(user_instance.email)
            uid = firebase_user.uid
            logger.info(f"El usuario {user_instance.email} ya existía en Firebase. Enlazando UID.")

        User.objects.filter(pk=user_instance.pk).update(firebase_uid=uid)

    except Exception as e:
        logger.error(f"Error crítico sincronizando usuario {user_instance.email} con Firebase: {e}")