from django.urls import path
from .views import UserProfileAPIView, VetCreateOwnerAPIView

app_name = 'users'

urlpatterns =[
    path('me/', UserProfileAPIView.as_view(), name='user-profile'),
    path('owners/', VetCreateOwnerAPIView.as_view(), name='create-owner'),
]