import re
from rest_framework import serializers
from apps.users.models import User
from apps.patients.models import Patient
from apps.monitoring.models import SurgicalMonitoring, Report, CustomQuestion


class AnswerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    question_text = serializers.CharField()
    value = serializers.CharField()

class VetReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='monitoring.patient.name', read_only=True)
    patient_photo = serializers.URLField(source='monitoring.patient.photo_url', read_only=True)
    owner_name = serializers.CharField(source='monitoring.patient.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='monitoring.patient.owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='monitoring.patient.owner.email', read_only=True)
    surgery_type = serializers.CharField(source='monitoring.surgery_type', read_only=True)
    day_number = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'submitted_at', 'calculated_risk', 'validated_risk',
            'review_status', 'medical_notes', 'day_number',
            'patient_name', 'patient_photo', 'owner_name', 'owner_phone', 'owner_email',
            'surgery_type'
        ]

    def get_day_number(self, obj):
        if obj.monitoring and obj.monitoring.surgery_date:
            delta = obj.submitted_at.replace(tzinfo=obj.monitoring.surgery_date.tzinfo) - obj.monitoring.surgery_date
            return delta.days + 1
        return 1

class VetReportDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='monitoring.patient.name', read_only=True)
    patient_photo = serializers.URLField(source='monitoring.patient.photo_url', read_only=True)
    owner_name = serializers.CharField(source='monitoring.patient.owner.full_name', read_only=True)
    owner_phone = serializers.CharField(source='monitoring.patient.owner.phone_number', read_only=True)
    owner_email = serializers.EmailField(source='monitoring.patient.owner.email', read_only=True)
    surgery_type = serializers.CharField(source='monitoring.surgery_type', read_only=True)
    day_number = serializers.SerializerMethodField()
    general_questions = serializers.SerializerMethodField()
    custom_questions = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    general_notes = serializers.SerializerMethodField()
    evidences = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'submitted_at', 'calculated_risk', 'validated_risk',
            'review_status', 'medical_notes', 'day_number',
            'patient_name', 'patient_photo', 'owner_name', 'owner_phone', 'owner_email',
            'surgery_type', 'general_questions', 'custom_questions', 'answers', 'general_notes',
            'evidences'
        ]

    def get_day_number(self, obj):
        if obj.monitoring and obj.monitoring.surgery_date:
            delta = obj.submitted_at.replace(tzinfo=obj.monitoring.surgery_date.tzinfo) - obj.monitoring.surgery_date
            return delta.days + 1
        return 1

    def get_general_questions(self, obj):
        from apps.monitoring.models import GeneralQuestion
        questions = GeneralQuestion.objects.filter(is_active=True)
        return [{'id': q.id, 'text': q.text, 'instruction_text': q.instruction_text} for q in questions]

    def get_custom_questions(self, obj):
        if obj.monitoring:
            return [
                {'id': q.id, 'text': q.text, 'instruction_text': q.instruction_text}
                for q in obj.monitoring.custom_questions.filter(is_active=True)
            ]
        return []

    def get_answers(self, obj):
        """
        Respuestas enriquecidas con el riesgo clínico real de cada factor en la
        ventana temporal del reporte (no por Sí/No, que sería incorrecto). Permite
        al frontend resaltar las señales de alerta y ordenarlas por gravedad.
        """
        from apps.patients.services.risk_evaluation import _resolve_window
        from apps.patients.models import FactorWindowRisk

        # Ventana del reporte, medida desde la cirugía.
        window = None
        if obj.monitoring and obj.monitoring.surgery_date:
            hours = (obj.submitted_at - obj.monitoring.surgery_date).total_seconds() / 3600
            window = _resolve_window(hours)

        risk_by_question = {}
        if window:
            for fwr in FactorWindowRisk.objects.filter(window=window):
                risk_by_question[fwr.question_id] = fwr.risk_level

        severity = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, None: 0}

        answers = obj.answers.select_related('general_question', 'custom_question').all()
        result = []
        for a in answers:
            if a.general_question:
                qtype = 'general'
                question_text = a.general_question.text
                instruction = a.general_question.instruction_text
                # "Presente" = el dueño respondió que sí ocurre el signo.
                present = str(a.value).strip().lower() in ('yes', 'true', 'sí', 'si', '1')
                if present:
                    risk_level = risk_by_question.get(
                        a.general_question_id,
                        a.general_question.associated_risk or None,
                    )
                else:
                    risk_level = None
            elif a.custom_question:
                qtype = 'custom'
                question_text = a.custom_question.text
                instruction = a.custom_question.instruction_text
                present = None
                risk_level = None
            else:
                qtype = 'general'
                question_text = 'Pregunta desconocida'
                instruction = None
                present = None
                risk_level = None

            result.append({
                'id': a.id,
                'type': qtype,
                'question_text': question_text or 'Pregunta desconocida',
                'instruction_text': instruction,
                'value': a.value,
                'present': present,
                'risk_level': risk_level,
            })

        # Generales primero (las señales clínicas) ordenadas por gravedad; custom al final.
        result.sort(key=lambda r: (
            0 if r['type'] == 'general' else 1,
            -severity.get(r['risk_level'], 0),
        ))
        return result

    def get_general_notes(self, obj):
        return obj.medical_notes or ''

    def get_evidences(self, obj):
        evidences = obj.evidences.all()
        return [
            {'id': e.id, 'image_url': e.image_url, 'created_at': e.created_at}
            for e in evidences
        ]


class VetOwnerSerializer(serializers.ModelSerializer):
    """
    Represents an owner *as seen by the selected clinic*: the profile fields come
    from that clinic's ClinicMembership (its own per-clinic copy), never from the
    global User — so one clinic never sees another clinic's data (Ley 1581).
    """
    full_name = serializers.SerializerMethodField()
    identification_type = serializers.SerializerMethodField()
    identification_number = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    patients_count = serializers.SerializerMethodField()
    patients = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'identification_type', 'identification_number',
            'phone_number', 'address', 'patients_count', 'patients', 'created_at'
        ]

    def _clinic_id(self):
        ids = self.context.get('clinic_ids', [])
        return ids[0] if ids else None

    def _membership(self, obj):
        cid = self._clinic_id()
        if not cid:
            return None
        cache = self.context.setdefault('_membership_cache', {})
        key = (obj.id, cid)
        if key not in cache:
            from apps.clinics.models import ClinicMembership
            cache[key] = ClinicMembership.objects.filter(user=obj, clinic_id=cid).first()
        return cache[key]

    def get_full_name(self, obj):
        m = self._membership(obj)
        return (m.full_name if m and m.full_name else obj.full_name)

    def get_identification_type(self, obj):
        m = self._membership(obj)
        return ((m.identification_type if m else obj.identification_type) or '')

    def get_identification_number(self, obj):
        m = self._membership(obj)
        return (m.identification_number if m else obj.identification_number)

    def get_phone_number(self, obj):
        m = self._membership(obj)
        return (m.phone_number if m else obj.phone_number)

    def get_address(self, obj):
        m = self._membership(obj)
        return (m.address if m else obj.address)

    def get_patients_count(self, obj):
        cid = self._clinic_id()
        if not cid:
            return 0
        return obj.patients.filter(clinic_id=cid, is_active=True).count()

    def get_patients(self, obj):
        cid = self._clinic_id()
        if not cid:
            return []
        patients = obj.patients.filter(clinic_id=cid, is_active=True)
        return [
            {
                'id': p.id,
                'name': p.name,
                'species': p.species,
                'breed': p.breed,
                'birth_date': p.birth_date.isoformat() if p.birth_date else None,
                'current_weight': p.current_weight,
                'photo_url': p.photo_url,
            }
            for p in patients
        ]


class VetOwnerCreateSerializer(serializers.ModelSerializer):
    # Declared explicitly so DRF does NOT auto-add the model's unique-email validator.
    # Registering an existing email must LINK the account (idempotent), not fail validation.
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    identification_type = serializers.ChoiceField(
        choices=['CC', 'CE', 'PA', 'PEP'],
        required=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'identification_type', 'password', 'confirm_password',
            'identification_number', 'phone_number', 'address'
        ]
        read_only_fields = ['id']

    def validate_password(self, value):
        if not value or value.strip() == '':
            return None

        errors = []
        if len(value) < 8:
            errors.append('La contraseña debe tener al menos 8 caracteres.')
        if not re.search(r'\d', value):
            errors.append('La contraseña debe contener al menos un número.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            errors.append('La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*).')

        if errors:
            raise serializers.ValidationError(errors)

        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.pop('confirm_password', None)
        identification_type = attrs.get('identification_type')

        if password and confirm_password and password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden.'})

        identification_number = attrs.get('identification_number')
        if not identification_number or identification_number.strip() == '':
            raise serializers.ValidationError({'identification_number': 'El número de identificación es obligatorio.'})

        return attrs

    def create(self, validated_data):
        from firebase_admin import auth as firebase_auth
        from apps.clinics.models import ClinicMembership
        from apps.core.services import email as email_service

        request = self.context['request']
        clinic_ids = self.context.get('clinic_ids', [])
        if not clinic_ids:
            raise serializers.ValidationError({'clinic': 'No hay clínica seleccionada.'})
        clinic_id = clinic_ids[0]

        identification_type = validated_data.pop('identification_type', None)
        validated_data.pop('password', None)         # the clinic NEVER sets the password
        validated_data.pop('confirm_password', None)

        email = validated_data['email']
        full_name = validated_data.get('full_name', '')
        identification_number = validated_data.get('identification_number')
        phone_number = validated_data.get('phone_number')
        address = validated_data.get('address')

        # --- Resolve the global identity, idempotently by email ---
        # No global existence is exposed to the clinic: the response is identical
        # whether or not the person already existed (no existence leak, Ley 1581).
        user = User.objects.filter(email__iexact=email).first()
        is_new_account = user is None

        # Already registered in THIS clinic? Block — re-registering must not silently
        # overwrite the existing owner's per-clinic profile. (Linking the same person to
        # a DIFFERENT clinic is still allowed below, without revealing where else they exist.)
        if user is not None and ClinicMembership.objects.filter(
            user=user, clinic_id=clinic_id, is_active=True
        ).exists():
            raise serializers.ValidationError(
                {'email': 'Ya existe un propietario con este correo en esta clínica.'}
            )

        if user is None:
            firebase_uid = None
            try:
                firebase_user = firebase_auth.create_user(email=email, display_name=full_name)
                firebase_uid = firebase_user.uid
            except firebase_auth.EmailAlreadyExistsError:
                # Identity exists in Firebase but not yet in Django → link it; never reset its password.
                firebase_uid = firebase_auth.get_user_by_email(email).uid
                is_new_account = False
            except Exception:
                firebase_uid = None

            user = User.objects.create(
                email=email,
                full_name=full_name,
                role='OWNER',
                firebase_uid=firebase_uid,
                managed_by=request.user,
                identification_type=identification_type,
                identification_number=identification_number,
                phone_number=phone_number,
                address=address,
                is_active=True,
                # The owner sets their OWN password via the activation email, so there is
                # no clinic-assigned temporary password to force-change on first login.
                password_changed=True,
            )
            user.set_unusable_password()  # owner sets their own via the activation email
            user.save(update_fields=['password'])
        # else: the user already exists globally → reuse as-is. Never reset password or role.

        # --- Per-clinic membership + profile (idempotent for this clinic) ---
        ClinicMembership.objects.update_or_create(
            user=user,
            clinic_id=clinic_id,
            defaults={
                'role': 'OWNER',
                'is_active': True,
                'unlinked_at': None,
                'full_name': full_name,
                'identification_type': identification_type,
                'identification_number': identification_number,
                'phone_number': phone_number,
                'address': address,
            },
        )

        # --- Notify the person. Email failures must never break registration nor leak. ---
        try:
            if is_new_account:
                email_service.send_owner_activation_email(user, clinic_id)
            else:
                email_service.send_clinic_added_email(user, clinic_id)
        except Exception:
            pass

        return user

    def to_representation(self, instance):
        # Echo back the per-clinic profile (what THIS clinic just stored), never the
        # global canonical, so the response is identical regardless of prior existence.
        from apps.clinics.models import ClinicMembership
        clinic_ids = self.context.get('clinic_ids', [])
        cid = clinic_ids[0] if clinic_ids else None
        m = ClinicMembership.objects.filter(user=instance, clinic_id=cid).first() if cid else None
        return {
            'id': instance.id,
            'email': instance.email,
            'full_name': (m.full_name if m and m.full_name else instance.full_name),
            'identification_type': ((m.identification_type if m else instance.identification_type) or ''),
            'identification_number': (m.identification_number if m else instance.identification_number),
            'phone_number': (m.phone_number if m else instance.phone_number),
            'address': (m.address if m else instance.address),
        }


class VetOwnerUpdateSerializer(serializers.Serializer):
    """
    Vet edits an owner's profile. Writes ONLY to this clinic's ClinicMembership
    (its own per-clinic copy), never to the global User or other clinics' copies.
    """
    full_name = serializers.CharField(required=False, allow_blank=True)
    identification_type = serializers.CharField(required=False, allow_blank=True)
    identification_number = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def update(self, instance, validated_data):
        from apps.clinics.models import ClinicMembership
        clinic_ids = self.context.get('clinic_ids', [])
        clinic_id = clinic_ids[0] if clinic_ids else None
        if not clinic_id:
            raise serializers.ValidationError({'clinic': 'No hay clínica seleccionada.'})
        membership = ClinicMembership.objects.filter(
            user=instance, clinic_id=clinic_id, is_active=True
        ).first()
        if not membership:
            raise serializers.ValidationError({'owner': 'El propietario no pertenece a esta clínica.'})
        for field in ('full_name', 'identification_type', 'identification_number', 'phone_number', 'address'):
            if field in validated_data:
                setattr(membership, field, validated_data[field])
        membership.save()
        return instance

    def to_representation(self, instance):
        return VetOwnerSerializer(instance, context=self.context).data


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


class VetMonitoringSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    owner_name = serializers.CharField(source='patient.owner.full_name', read_only=True)
    owner_email = serializers.EmailField(source='patient.owner.email', read_only=True)
    owner_identification_number = serializers.CharField(source='patient.owner.identification_number', read_only=True)
    active_reports = serializers.SerializerMethodField()
    days_since_surgery = serializers.SerializerMethodField()
    days_since_release = serializers.SerializerMethodField()

    class Meta:
        model = SurgicalMonitoring
        fields = [
            'id', 'surgery_type', 'surgery_date', 'home_release_date', 'discharged_at',
            'report_frequency_hours', 'status', 'patient_name', 'owner_name', 'owner_email',
            'owner_identification_number', 'active_reports', 'days_since_surgery', 'days_since_release'
        ]

    def get_active_reports(self, obj):
        return obj.reports.filter(review_status='PENDING').count()

    def get_days_since_surgery(self, obj):
        if not obj.surgery_date:
            return None
        from django.utils import timezone
        return (timezone.now().date() - obj.surgery_date.date()).days

    def get_days_since_release(self, obj):
        if not obj.home_release_date:
            return None
        from django.utils import timezone
        return (timezone.now().date() - obj.home_release_date.date()).days


class CustomQuestionInputSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=500)
    instruction_text = serializers.CharField(
        max_length=2000, required=False, allow_blank=True, default=''
    )


class VetMonitoringCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True)
    report_frequency_hours = serializers.IntegerField(
        min_value=1,
        error_messages={
            'min_value': 'La frecuencia debe ser de al menos 1 hora.',
            'invalid': 'Ingrese un número válido de horas.',
        },
    )
    # Preguntas personalizadas que el propietario responderá en cada reporte.
    custom_questions = CustomQuestionInputSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = SurgicalMonitoring
        fields = ['id', 'patient_id', 'surgery_type', 'surgery_date', 'home_release_date',
                  'report_frequency_hours', 'status', 'custom_questions']

    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id')
        custom_questions = validated_data.pop('custom_questions', [])
        patient = Patient.objects.get(id=patient_id)
        monitoring = SurgicalMonitoring.objects.create(patient=patient, **validated_data)
        for cq in custom_questions:
            text = (cq.get('text') or '').strip()
            if not text:
                continue
            CustomQuestion.objects.create(
                monitoring=monitoring,
                text=text,
                instruction_text=(cq.get('instruction_text') or '').strip(),
            )
        return monitoring