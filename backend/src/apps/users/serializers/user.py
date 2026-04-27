from rest_framework import serializers
from apps.users.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'identification_number', 
            'phone_number', 'address', 'role', 'password_changed', 
            'terms_accepted_at', 'terms_accepted_ip', 'terms_accepted_version',
            'managed_by'
        )
        read_only_fields = (
            'id', 'email', 'role', 'managed_by',
            'terms_accepted_at', 'terms_accepted_ip', 'terms_accepted_version'
        )

class OwnerCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True)
    identification_number = serializers.CharField(required=True)
    
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = ('email', 'full_name', 'identification_number', 'phone_number', 'address')