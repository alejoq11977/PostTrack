from django.urls import path
from .views import MonitoringFormAPIView

app_name = 'monitoring'

urlpatterns =[
    path('<int:pk>/form/', MonitoringFormAPIView.as_view(), name='monitoring-form'),
]