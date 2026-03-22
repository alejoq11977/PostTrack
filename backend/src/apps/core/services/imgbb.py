import mimetypes  # <-- NUEVA LÍNEA
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def upload_image_to_imgbb(image_file):
    api_key = getattr(settings, 'IMGBB_API_KEY', None)
    
    if not api_key:
        return None

    url = "https://api.imgbb.com/1/upload"
    
    try:
        payload = {"key": api_key}
        
        # 1. Buscamos el content_type. Si no existe (porque viene del disco duro), lo adivinamos.
        content_type = getattr(image_file, 'content_type', None)
        if not content_type:
            content_type, _ = mimetypes.guess_type(image_file.name)
            content_type = content_type or 'image/jpeg' # Fallback por si acaso
        
        # 2. Empaquetamos la imagen para requests
        files = {
            "image": (image_file.name, image_file.read(), content_type)
        }
        
        response = requests.post(url, data=payload, files=files)
        response.raise_for_status() 
        
        data = response.json()
        logger.info("Imagen subida a ImgBB con éxito.")
        
        return data['data']['url']
        
    except Exception as e:
        logger.error(f"Error subiendo imagen a ImgBB: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Detalle de ImgBB: {e.response.text}")
        return None