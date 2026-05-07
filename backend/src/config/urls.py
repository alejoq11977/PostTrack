from django.contrib import admin
from django.urls import path, include

urlpatterns =[
    path('admin/', admin.site.urls),

    path('api/users/', include('apps.users.api.urls')),
    path('api/patients/', include('apps.patients.api.urls')),
    path('api/monitoring/', include('apps.monitoring.api.urls')),
    path('api/clinics/', include('apps.clinics.api.urls')),
]