import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

app = Celery('posttrack')

app.config_from_object('django.conf:settings', namespace='CELERY')

# Recordatorios al propietario de reportes vencidos: cada 30 min revisa todos
# los seguimientos activos y envía correo si toca (máx 3 por ciclo, 1 cada 24h).
app.conf.beat_schedule = {
    'send-overdue-report-reminders': {
        'task': 'apps.monitoring.tasks.send_overdue_reminders',
        'schedule': crontab(minute='*/30'),
    },
}

app.autodiscover_tasks()