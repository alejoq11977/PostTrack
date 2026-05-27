from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    """
    Backfill memberships from the previous data model.
    (No-op on an empty DB; correct for future real data.)
    """
    ClinicMembership = apps.get_model('clinics', 'ClinicMembership')
    Patient = apps.get_model('patients', 'Patient')

    # Existing rows came from VetClinic → they are veterinarians.
    # Mark their role and copy the user's contact into the per-clinic profile.
    for m in ClinicMembership.objects.all():
        u = m.user
        m.role = 'VETERINARIAN'
        m.full_name = (u.full_name or '')
        m.identification_type = u.identification_type
        m.identification_number = u.identification_number
        m.phone_number = u.phone_number
        m.address = u.address
        m.save()

    # Create OWNER memberships from existing patients (one per owner+clinic).
    seen = set()
    for p in Patient.objects.filter(clinic__isnull=False).select_related('owner'):
        key = (p.owner_id, p.clinic_id)
        if key in seen:
            continue
        seen.add(key)
        if ClinicMembership.objects.filter(user_id=p.owner_id, clinic_id=p.clinic_id).exists():
            continue
        u = p.owner
        ClinicMembership.objects.create(
            user_id=p.owner_id,
            clinic_id=p.clinic_id,
            role='OWNER',
            full_name=(u.full_name or ''),
            identification_type=u.identification_type,
            identification_number=u.identification_number,
            phone_number=u.phone_number,
            address=u.address,
            is_active=True,
        )


def backwards(apps, schema_editor):
    # Data migration: nothing to undo at the row level.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clinics', '0003_alter_vetclinic_options_and_more'),
        ('patients', '0004_add_risk_models'),
        ('users', '0006_alter_user_identification_number'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='vetclinic',
            unique_together=set(),
        ),
        migrations.RenameModel(
            old_name='VetClinic',
            new_name='ClinicMembership',
        ),
        migrations.RenameField(
            model_name='clinicmembership',
            old_name='veterinarian',
            new_name='user',
        ),
        migrations.AlterModelOptions(
            name='clinicmembership',
            options={'ordering': ['-linked_at'], 'verbose_name': 'Membresía de Clínica', 'verbose_name_plural': 'Membresías de Clínica'},
        ),
        migrations.AlterField(
            model_name='clinicmembership',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clinic_memberships', to='users.user', verbose_name='Usuario'),
        ),
        migrations.AlterField(
            model_name='clinicmembership',
            name='clinic',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='clinics.clinic', verbose_name='Clínica'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='role',
            field=models.CharField(choices=[('ADMIN', 'Admin'), ('VETERINARIAN', 'Veterinarian'), ('OWNER', 'Owner')], default='OWNER', max_length=20, verbose_name='Rol en la clínica'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='full_name',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Nombre completo'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='identification_type',
            field=models.CharField(blank=True, choices=[('CC', 'Cédula de Ciudadanía'), ('CE', 'Cédula de Extranjería'), ('PA', 'Pasaporte'), ('PEP', 'Permiso Especial')], max_length=3, null=True, verbose_name='Tipo de identificación'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='identification_number',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Número de identificación'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='phone_number',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Teléfono'),
        ),
        migrations.AddField(
            model_name='clinicmembership',
            name='address',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Dirección'),
        ),
        migrations.AddConstraint(
            model_name='clinicmembership',
            constraint=models.UniqueConstraint(fields=('user', 'clinic'), name='unique_user_per_clinic'),
        ),
        migrations.AddConstraint(
            model_name='clinicmembership',
            constraint=models.UniqueConstraint(condition=models.Q(('identification_number__isnull', False)), fields=('clinic', 'identification_number'), name='unique_identification_per_clinic'),
        ),
        migrations.RunPython(forwards, backwards),
    ]
