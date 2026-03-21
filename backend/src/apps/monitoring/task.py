import logging
from celery import shared_task
from django.core.files.storage import default_storage
from apps.monitoring.models import Report, VisualEvidence, ProcessingStatus
from apps.core.services.imgbb import upload_image_to_imgbb

logger = logging.getLogger(__name__)

@shared_task
def process_report_images_task(report_id: int, file_paths: list):
    """
    Tarea asíncrona de Celery.
    Toma los archivos guardados temporalmente en el disco, 
    los sube a ImgBB uno por uno, y borra los archivos temporales.
    """
    logger.info(f"Iniciando procesamiento en segundo plano para Reporte {report_id}...")
    
    try:
        report = Report.objects.get(id=report_id)
        
        for file_path in file_paths:
            if default_storage.exists(file_path):
                with default_storage.open(file_path, 'rb') as f:
                    image_url = upload_image_to_imgbb(f)
                    
                    if image_url:
                        VisualEvidence.objects.create(report=report, image_url=image_url)
                
                default_storage.delete(file_path)

        report.processing_status = ProcessingStatus.COMPLETED
        report.save(update_fields=['processing_status'])
        logger.info(f"Procesamiento completado para Reporte {report_id}.")

    except Exception as e:
        logger.error(f"Error crítico procesando imágenes para Reporte {report_id}: {e}")
        
        try:
            report = Report.objects.get(id=report_id)
            report.processing_status = ProcessingStatus.FAILED
            report.save(update_fields=['processing_status'])
        except Exception:
            pass