from django.urls import path, include

urlpatterns = [
    path('api/clinics/', include('apps.clinics.api.urls')),
]
