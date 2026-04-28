from django.urls import path
from .views import UserProfileAPIView, VetCreateOwnerAPIView, CompleteProfileAPIView, AcceptTermsAPIView, PrivacyPolicyActiveAPIView, DeactivateAccountAPIView

app_name = 'users'

urlpatterns = [
    path('me/', UserProfileAPIView.as_view(), name='user-profile'),
    path('owners/', VetCreateOwnerAPIView.as_view(), name='create-owner'),
    path('complete-profile/', CompleteProfileAPIView.as_view(), name='complete-profile'),
    path('accept-terms/', AcceptTermsAPIView.as_view(), name='accept-terms'),
    path('privacy-policy/active/', PrivacyPolicyActiveAPIView.as_view(), name='privacy-policy-active'),
    path('deactivate/', DeactivateAccountAPIView.as_view(), name='deactivate-account'),
]