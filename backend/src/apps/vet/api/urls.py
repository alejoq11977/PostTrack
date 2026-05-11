from django.urls import path
from .views import (
    VetReportsListView,
    VetReportsDetailView,
    vet_reports_validate,
    vet_reports_mark_reviewed,
    vet_reports_stats,
    VetOwnersListView,
    VetOwnerDetailView,
    VetPatientsSearchView,
    VetPatientsCreateView,
    VetPatientsUpdateView,
    VetMonitoringsListView,
    vet_sse_alerts,
    vet_alerts_all,
    vet_missing_reports
)

app_name = 'vet'

urlpatterns = [
    path('reports/', VetReportsListView.as_view(), name='reports-list'),
    path('reports/<int:pk>/', VetReportsDetailView.as_view(), name='reports-detail'),
    path('reports/<int:pk>/validate/', vet_reports_validate, name='reports-validate'),
    path('reports/<int:pk>/mark-reviewed/', vet_reports_mark_reviewed, name='reports-mark-reviewed'),
    path('reports/stats/', vet_reports_stats, name='reports-stats'),
    path('owners/', VetOwnersListView.as_view(), name='owners-list'),
    path('owners/<int:pk>/', VetOwnerDetailView.as_view(), name='owners-detail'),
    path('patients/search/', VetPatientsSearchView.as_view(), name='patients-search'),
    path('patients/', VetPatientsCreateView.as_view(), name='patients-create'),
    path('patients/<int:pk>/', VetPatientsUpdateView.as_view(), name='patients-update'),
    path('monitorings/', VetMonitoringsListView.as_view(), name='monitorings-list'),
    path('alerts/stream/', vet_sse_alerts, name='alerts-stream'),
    path('alerts/all/', vet_alerts_all, name='alerts-all'),
    path('reports/missing/', vet_missing_reports, name='reports-missing'),
]