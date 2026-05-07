from django.urls import path
from .views import (
    ClinicListAPIView,
    ClinicDetailAPIView,
    VetClinicLinkAPIView,
    VetClinicUnlinkAPIView,
    PendingTermsAPIView,
    AllPendingTermsAPIView,
    AcceptTermsAPIView,
    DataPolicyDetailAPIView,
    DataAuthorizationDetailAPIView,
    ClinicAuditLogAPIView,
    ClinicLogoutAPIView,
)

app_name = 'clinics'

urlpatterns = [
    path('', ClinicListAPIView.as_view(), name='clinic-list'),
    path('<int:clinic_id>/', ClinicDetailAPIView.as_view(), name='clinic-detail'),
    path('vet/link/', VetClinicLinkAPIView.as_view(), name='vet-link'),
    path('vet/unlink/<int:vet_clinic_id>/', VetClinicUnlinkAPIView.as_view(), name='vet-unlink'),
    path('pending-terms/', PendingTermsAPIView.as_view(), name='pending-terms'),
    path('all-pending-terms/', AllPendingTermsAPIView.as_view(), name='all-pending-terms'),
    path('accept-terms/', AcceptTermsAPIView.as_view(), name='accept-terms'),
    path('policies/<int:policy_id>/', DataPolicyDetailAPIView.as_view(), name='policy-detail'),
    path('authorizations/<int:authorization_id>/', DataAuthorizationDetailAPIView.as_view(), name='authorization-detail'),
    path('<int:clinic_id>/audit-log/', ClinicAuditLogAPIView.as_view(), name='audit-log'),
    path('<int:clinic_id>/logout/', ClinicLogoutAPIView.as_view(), name='clinic-logout'),
]
