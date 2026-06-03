from rest_framework import serializers
from apps.users.models import User
from apps.patients.models import Patient


class VetPatientSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'species', 'breed', 'birth_date', 'current_weight', 'photo_url',
            'owner_id', 'owner_name', 'owner_phone', 'owner_email'
        ]


class VetPatientCreateSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(write_only=True, required=True)
    breed = serializers.CharField(required=False, allow_blank=True, default='')
    birth_date = serializers.DateField(required=True)

    class Meta:
        model = Patient
        fields = ['name', 'species', 'breed', 'birth_date', 'current_weight', 'photo_url', 'owner_id']

    def validate(self, attrs):
        from apps.clinics.models import ClinicMembership
        owner_id = attrs.get('owner_id')
        clinic_ids = self.context.get('clinic_ids', [])
        if not clinic_ids:
            raise serializers.ValidationError({'clinic': 'No hay clínica seleccionada.'})
        clinic_id = clinic_ids[0]

        try:
            owner = User.objects.get(id=owner_id, role='OWNER')
        except User.DoesNotExist:
            raise serializers.ValidationError({'owner_id': 'Propietario no encontrado o rol inválido.'})

        # The owner must be a member of THIS clinic (registered here first).
        if not ClinicMembership.objects.filter(user=owner, clinic_id=clinic_id, is_active=True).exists():
            raise serializers.ValidationError(
                {'owner_id': 'El propietario no está registrado en esta clínica. Regístralo primero.'}
            )

        return attrs

    def create(self, validated_data):
        owner_id = validated_data.pop('owner_id', None)
        clinic_ids = self.context.get('clinic_ids', [])
        if not clinic_ids:
            raise serializers.ValidationError({'clinic': 'No hay clínica seleccionada.'})
        clinic_id = clinic_ids[0]

        birth_date = validated_data.get('birth_date')
        if birth_date is None or birth_date == '':
            validated_data.pop('birth_date', None)

        if not owner_id:
            raise serializers.ValidationError({'owner_id': 'Se requiere el propietario.'})

        owner = User.objects.get(id=owner_id)
        return Patient.objects.create(owner=owner, clinic_id=clinic_id, **validated_data)


class VetPatientUpdateSerializer(serializers.ModelSerializer):
    breed = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Patient
        fields = ['name', 'species', 'breed', 'birth_date', 'current_weight', 'photo_url']

    def validate(self, attrs):
        clinic_ids = self.context.get('clinic_ids', [])
        if not clinic_ids:
            raise serializers.ValidationError(
                {'clinic': 'No clinic access. Cannot update patient.'}
            )
        return attrs
