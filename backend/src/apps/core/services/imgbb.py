import uuid 
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
        
        unique_name = f"{uuid.uuid4().hex}_{image_file.name}"
        
        files = {
            "image": (unique_name, image_file.read(), image_file.content_type)
        }
        
        response = requests.post(url, data=payload, files=files)
        response.raise_for_status() 
        
        return response.json()['data']['url']
        
    except Exception as e:
        logger.error(f"❌ Error subiendo imagen a ImgBB: {e}")
        return None