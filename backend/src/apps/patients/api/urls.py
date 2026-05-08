from django.urls import path
from .views import PatientListAPIView, EvaluateRiskAPIView

app_name = 'patients'

urlpatterns =[
    path('', PatientListAPIView.as_view(), name='patient-list'),
    path('evaluate-risk/', EvaluateRiskAPIView.as_view(), name='evaluate-risk'),
]