import json
import logging
import uuid

from django.db import transaction
from django.core.files.storage import default_storage

from apps.monitoring.models import (
    Report,
    Answer,
    SurgicalMonitoring,
    ProcessingStatus
)

from apps.monitoring.tasks import process_report_images_task

logger = logging.getLogger(__name__)


def create_monitoring_report(
    monitoring: SurgicalMonitoring,
    data: dict,
    files: dict
) -> Report:
    try:
        general_answers = json.loads(data.get('generalAnswers', '{}'))
        custom_answers = json.loads(data.get('customAnswers', '{}'))
        medical_notes = data.get('medicalNotes', '')

        image_files = [
            file for key, file in files.items()
            if key.startswith('image_')
        ]

        saved_file_paths = []

        for file in image_files:
            temp_name = f"temp/{uuid.uuid4().hex}_{file.name}"
            saved_path = default_storage.save(temp_name, file)
            saved_file_paths.append(saved_path)

        with transaction.atomic():

            status = (
                ProcessingStatus.PROCESSING
                if saved_file_paths
                else ProcessingStatus.COMPLETED
            )

            report = Report.objects.create(
                monitoring=monitoring,
                medical_notes=medical_notes,
                processing_status=status
            )

            answers_to_create = []

            for question_id, value in general_answers.items():
                answers_to_create.append(
                    Answer(
                        report=report,
                        general_question_id=int(question_id),
                        custom_question=None,
                        value=value
                    )
                )

            for question_id, value in custom_answers.items():
                answers_to_create.append(
                    Answer(
                        report=report,
                        custom_question_id=int(question_id),
                        general_question=None,
                        value=value
                    )
                )

            if answers_to_create:
                Answer.objects.bulk_create(answers_to_create)

        if saved_file_paths:
            process_report_images_task.delay(
                report.id,
                saved_file_paths
            )

        return report

    except Exception as e:
        logger.error(f"Error creando reporte: {e}", exc_info=True)
        raise