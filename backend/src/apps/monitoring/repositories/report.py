from apps.monitoring.models import Report, Answer

def get_report_history_for_monitoring(monitoring_id: int, owner):
    """
    Obtiene todos los reportes de una cirugía específica, 
    validando que el dueño sea el correcto.
    """
    return Report.objects.filter(
        monitoring_id=monitoring_id,
        monitoring__patient__owner=owner,
        is_active=True
    ).order_by('-submitted_at')

def save_report_with_answers(monitoring, medical_notes, status, general_answers: dict, custom_answers: dict) -> Report:
    """
    Guarda el reporte y sus respuestas en la base de datos de forma masiva.
    """
    report = Report.objects.create(
        monitoring=monitoring,
        medical_notes=medical_notes,
        processing_status=status
    )

    answers_to_create =[]

    for question_id, value in general_answers.items():
        answers_to_create.append(
            Answer(report=report, general_question_id=int(question_id), value=value)
        )

    for question_id, value in custom_answers.items():
        answers_to_create.append(
            Answer(report=report, custom_question_id=int(question_id), value=value)
        )

    if answers_to_create:
        Answer.objects.bulk_create(answers_to_create)

    return report