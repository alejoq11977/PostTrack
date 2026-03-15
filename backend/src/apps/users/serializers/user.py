from rest_framework import serializers
from apps.users.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'identification_number', 
            'role', 'password_changed', 'terms_accepted_at'
        )
        read_only_fields = ('id', 'email', 'role')