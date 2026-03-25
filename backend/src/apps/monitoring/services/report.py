import json
import logging
import uuid

from django.db import transaction
from django.core.files.storage import default_storage

from apps.monitoring.models import ProcessingStatus
from apps.monitoring.tasks import process_report_images_task
from apps.monitoring.repositories.report import save_report_with_answers

logger = logging.getLogger(__name__)


def create_monitoring_report(monitoring, data: dict, files: dict):
    try:
        general_answers = json.loads(data.get('generalAnswers', '{}'))
        custom_answers = json.loads(data.get('customAnswers', '{}'))
        medical_notes = data.get('medicalNotes', '')

        image_files =[f for key, f in files.items() if key.startswith('image_')]
        saved_file_paths =[]

        for file in image_files:
            temp_name = f"temp/{uuid.uuid4().hex}_{file.name}"
            saved_path = default_storage.save(temp_name, file)
            saved_file_paths.append(saved_path)

        with transaction.atomic():
            status = ProcessingStatus.PROCESSING if saved_file_paths else ProcessingStatus.COMPLETED
            
            report = save_report_with_answers(
                monitoring=monitoring,
                medical_notes=medical_notes,
                status=status,
                general_answers=general_answers,
                custom_answers=custom_answers
            )

        # 4. Celery (async)
        if saved_file_paths:
            process_report_images_task.delay(report.id, saved_file_paths)

        return report

    except Exception as e:
        logger.error(f"Error creando reporte: {e}", exc_info=True)
        raise