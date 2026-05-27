from rest_framework import serializers
from ..models import (
    Clinic, ClinicMembership, DataPolicy,
    DataAuthorization, DataTreatmentAcceptance, ClinicAuditLog
)


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = ['id', 'name', 'nit', 'address', 'email', 'phone', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClinicMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = ['id', 'name', 'nit']


class VetClinicSerializer(serializers.ModelSerializer):
    clinic = ClinicMinimalSerializer(read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = ClinicMembership
        fields = ['id', 'user', 'user_name', 'user_role', 'role', 'clinic', 'is_active', 'linked_at', 'unlinked_at']
        read_only_fields = ['id', 'linked_at', 'unlinked_at']


class VetClinicCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicMembership
        fields = ['user', 'clinic']


class DataPolicySerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = DataPolicy
        fields = [
            'id', 'clinic', 'clinic_name', 'version', 'content',
            'effective_date', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DataAuthorizationSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = DataAuthorization
        fields = [
            'id', 'clinic', 'clinic_name', 'version', 'content',
            'effective_date', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AcceptTermsSerializer(serializers.Serializer):
    clinic_id = serializers.IntegerField()
    policy_id = serializers.IntegerField(required=False)
    authorization_id = serializers.IntegerField(required=False)

    def validate_clinic_id(self, value):
        if not Clinic.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("La clínica no existe o no está activa.")
        return value

    def validate(self, data):
        clinic_id = data.get('clinic_id')
        policy_id = data.get('policy_id')
        authorization_id = data.get('authorization_id')

        if policy_id:
            if not DataPolicy.objects.filter(id=policy_id, clinic_id=clinic_id, is_active=True).exists():
                raise serializers.ValidationError({"policy_id": "La política no existe o no está activa para esta clínica."})

        if authorization_id:
            if not DataAuthorization.objects.filter(id=authorization_id, clinic_id=clinic_id, is_active=True).exists():
                raise serializers.ValidationError({"authorization_id": "La autorización no existe o no está activa para esta clínica."})

        return data


class DataTreatmentAcceptanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)

    class Meta:
        model = DataTreatmentAcceptance
        fields = [
            'id', 'user', 'user_name', 'clinic', 'clinic_name',
            'accepted_at', 'ip_address', 'user_agent',
            'policy_version', 'authorization_version'
        ]
        read_only_fields = ['id', 'accepted_at']


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


class PendingTermsSerializer(serializers.Serializer):
    clinic = ClinicMinimalSerializer()
    pending_policy = DataPolicySerializer(allow_null=True)
    pending_authorization = DataAuthorizationSerializer(allow_null=True)
    needs_acceptance = serializers.BooleanField()
