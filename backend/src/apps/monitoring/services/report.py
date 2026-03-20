import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed 
from django.db import transaction
from apps.monitoring.models import Report, Answer, VisualEvidence, SurgicalMonitoring
from apps.core.services.imgbb import upload_image_to_imgbb

logger = logging.getLogger(__name__)

def create_monitoring_report(monitoring: SurgicalMonitoring, data: dict, files: dict) -> Report:
    try:
        general_answers = json.loads(data.get('generalAnswers', '{}'))
        custom_answers = json.loads(data.get('customAnswers', '{}'))
        medical_notes = data.get('medicalNotes', '')

        image_files = [file for key, file in files.items() if key.startswith('image_')]
        uploaded_urls =[]

        if image_files:
            with ThreadPoolExecutor(max_workers=4) as executor:
                future_to_url = {executor.submit(upload_image_to_imgbb, f): f for f in image_files}
                
                for future in as_completed(future_to_url):
                    url = future.result()
                    if url:
                        uploaded_urls.append(url)

        with transaction.atomic():
            report = Report.objects.create(
                monitoring=monitoring,
                medical_notes=medical_notes,
            )

            answers_to_create =[]
            for q_id, val in general_answers.items():
                answers_to_create.append(Answer(report=report, general_question_id=int(q_id), value=val))

            for q_id, val in custom_answers.items():
                answers_to_create.append(Answer(report=report, custom_question_id=int(q_id), value=val))

            Answer.objects.bulk_create(answers_to_create)

            evidences_to_create =[
                VisualEvidence(report=report, image_url=url) for url in uploaded_urls
            ]
            VisualEvidence.objects.bulk_create(evidences_to_create)

            logger.info(f"Reporte {report.id} creado con {len(uploaded_urls)} fotos.")
            return report

    except Exception as e:
        logger.error(f"Error al crear el reporte: {str(e)}")
        raise e