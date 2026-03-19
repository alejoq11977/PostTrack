from django.urls import path
from .views import PatientListAPIView

app_name = 'patients'

urlpatterns =[
    path('', PatientListAPIView.as_view(), name='patient-list'),
]