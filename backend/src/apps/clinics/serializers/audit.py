from rest_framework import serializers
from ..models import ClinicAuditLog


class ClinicAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = ClinicAuditLog
        fields = [
            'id', 'clinic', 'clinic_name', 'user', 'user_name',
            'action', 'details', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ClinicAuditLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicAuditLog
        fields = ['clinic', 'action', 'details', 'ip_address', 'user_agent']
