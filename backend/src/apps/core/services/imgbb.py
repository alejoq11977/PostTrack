import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def upload_image_to_imgbb(image_file):
    """
    Recibe un archivo físico (File/InMemoryUploadedFile), lo envía a ImgBB 
    y retorna la URL pública de la imagen.
    """
    api_key = getattr(settings, 'IMGBB_API_KEY', None)
    
    if not api_key:
        logger.error("IMGBB_API_KEY no está configurada en las variables de entorno.")
        return None

    url = "https://api.imgbb.com/1/upload"
    
    try:
        payload = {"key": api_key}
        files = {"image": image_file}
        
        response = requests.post(url, data=payload, files=files)
        response.raise_for_status()
        
        data = response.json()
        logger.info("Imagen subida a ImgBB con éxito.")
        
        return data['data']['url'] 
        
    except Exception as e:
        logger.error(f"Error subiendo imagen a ImgBB: {e}")
        return None