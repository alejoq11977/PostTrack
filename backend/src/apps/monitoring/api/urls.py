from django.urls import path
from .views import MonitoringFormAPIView, MonitoringHistoryAPIView

app_name = 'monitoring'

urlpatterns =[
    path('<int:pk>/form/', MonitoringFormAPIView.as_view(), name='monitoring-form'),
    path('<int:pk>/history/', MonitoringHistoryAPIView.as_view(), name='monitoring-history'),
]