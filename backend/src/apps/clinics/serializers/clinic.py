from rest_framework import serializers
from ..models import Clinic, ClinicMembership


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
