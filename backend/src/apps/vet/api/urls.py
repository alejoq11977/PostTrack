from django.urls import path
from .views import (
    VetReportsListView,
    VetReportsDetailView,
    vet_reports_validate,
    VetOwnersListView,
    VetOwnerDetailView,
    VetPatientsSearchView,
    VetMonitoringsListView,
    vet_sse_alerts
)

app_name = 'vet'

urlpatterns = [
    path('reports/', VetReportsListView.as_view(), name='reports-list'),
    path('reports/<int:pk>/', VetReportsDetailView.as_view(), name='reports-detail'),
    path('reports/<int:pk>/validate/', vet_reports_validate, name='reports-validate'),
    path('owners/', VetOwnersListView.as_view(), name='owners-list'),
    path('owners/<int:pk>/', VetOwnerDetailView.as_view(), name='owners-detail'),
    path('patients/search/', VetPatientsSearchView.as_view(), name='patients-search'),
    path('monitorings/', VetMonitoringsListView.as_view(), name='monitorings-list'),
    path('alerts/stream/', vet_sse_alerts, name='alerts-stream'),
]