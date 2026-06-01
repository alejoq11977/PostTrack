import logging
from datetime import timedelta
from celery import shared_task
from django.core.files.storage import default_storage
from django.utils import timezone
from apps.monitoring.models import Report, VisualEvidence, ProcessingStatus, SurgicalMonitoring
from apps.core.services.imgbb import upload_image_to_imgbb
from apps.core.services.email import send_overdue_report_email

logger = logging.getLogger(__name__)

# Política anti-spam acordada con el producto.
MAX_OVERDUE_EMAILS = 3
HOURS_BETWEEN_EMAILS = 24


@shared_task
def send_overdue_reminders():
    """
    Recorre seguimientos activos cuyo próximo reporte ya venció y envía un
    recordatorio al propietario. Política:
      - Máximo 3 correos por ciclo de vencimiento.
      - Mínimo 24h entre correos.
      - El ciclo se reinicia cuando el propietario envía un reporte (ver
        `save_report_with_answers`).
    Se ejecuta por Celery Beat (configurado en `config/celery.py`).
    """
    now = timezone.now()
    monitorings = SurgicalMonitoring.objects.filter(
        status='ACTIVE',
        home_release_date__isnull=False,
        overdue_emails_sent__lt=MAX_OVERDUE_EMAILS,
    ).select_related('patient', 'patient__owner')

    sent = 0
    skipped = 0
    for m in monitorings:
        # Próximo reporte = (último reporte | salida a casa) + frecuencia.
        last = m.reports.filter(is_active=True).order_by('-submitted_at').first()
        anchor = last.submitted_at if last else m.home_release_date
        next_at = anchor + timedelta(hours=m.report_frequency_hours)
        if now <= next_at:
            continue  # aún no vencido

        # Anti-spam: respetar el intervalo mínimo entre correos.
        if m.last_overdue_email_at and (now - m.last_overdue_email_at) < timedelta(hours=HOURS_BETWEEN_EMAILS):
            skipped += 1
            continue

        owner = m.patient.owner if m.patient else None
        if not owner or not owner.email:
            continue  # sin destinatario válido

        hours_overdue = (now - next_at).total_seconds() / 3600
        try:
            delivered = send_overdue_report_email(owner, m, hours_overdue)
        except Exception as exc:
            logger.error("[overdue] error enviando a %s: %s", owner.email, exc)
            continue

        if not delivered:
            # En dev (sin Brevo configurado) o ante fallos transitorios, no
            # incrementamos el contador: la próxima ronda lo reintentará.
            continue

        m.last_overdue_email_at = now
        m.overdue_emails_sent = (m.overdue_emails_sent or 0) + 1
        m.save(update_fields=['last_overdue_email_at', 'overdue_emails_sent'])
        sent += 1
        logger.info(
            "[overdue] correo enviado a %s sobre %s (seguimiento %s, %d/%d)",
            owner.email, m.patient.name, m.id, m.overdue_emails_sent, MAX_OVERDUE_EMAILS,
        )

    logger.info("[overdue] resumen: enviados=%d, omitidos_por_intervalo=%d", sent, skipped)
    return {'sent': sent, 'skipped': skipped}

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