from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0003_privacypolicyversion_alter_user_terms_accepted_ip_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Clinic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('name', models.CharField(max_length=200, verbose_name='Nombre de la Clínica')),
                ('nit', models.CharField(max_length=20, unique=True, verbose_name='NIT')),
                ('address', models.CharField(max_length=300, verbose_name='Dirección')),
                ('email', models.EmailField(max_length=254, verbose_name='Correo electrónico')),
                ('phone', models.CharField(max_length=20, verbose_name='Teléfono')),
            ],
            options={
                'verbose_name': 'Clínica',
                'verbose_name_plural': 'Clínicas',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='DataAuthorization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('version', models.CharField(max_length=20, verbose_name='Versión')),
                ('content', models.TextField(verbose_name='Contenido de la Autorización')),
                ('effective_date', models.DateField(verbose_name='Fecha de vigencia')),
                ('clinic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='data_authorizations', to='clinics.clinic', verbose_name='Clínica')),
            ],
            options={
                'verbose_name': 'Autorización de Tratamiento de Datos',
                'verbose_name_plural': 'Autorizaciones de Tratamiento de Datos',
                'ordering': ['-effective_date'],
            },
        ),
        migrations.CreateModel(
            name='DataPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('version', models.CharField(max_length=20, verbose_name='Versión')),
                ('content', models.TextField(verbose_name='Contenido de la Política')),
                ('effective_date', models.DateField(verbose_name='Fecha de vigencia')),
                ('clinic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='data_policies', to='clinics.clinic', verbose_name='Clínica')),
            ],
            options={
                'verbose_name': 'Política de Tratamiento de Datos',
                'verbose_name_plural': 'Políticas de Tratamiento de Datos',
                'ordering': ['-effective_date'],
            },
        ),
        migrations.CreateModel(
            name='DataTreatmentAcceptance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('accepted_at', models.DateTimeField(verbose_name='Fecha de aceptación')),
                ('ip_address', models.GenericIPAddressField(verbose_name='Dirección IP')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User Agent')),
                ('policy_version', models.CharField(max_length=20, verbose_name='Versión de Política aceptada')),
                ('authorization_version', models.CharField(max_length=20, verbose_name='Versión de Autorización aceptada')),
                ('clinic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='data_acceptances', to='clinics.clinic', verbose_name='Clínica')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='data_acceptances', to='users.user', verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Aceptación de Tratamiento de Datos',
                'verbose_name_plural': 'Aceptaciones de Tratamiento de Datos',
                'ordering': ['-accepted_at'],
                'unique_together': {('user', 'clinic')},
            },
        ),
        migrations.CreateModel(
            name='VetClinic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('role', models.CharField(choices=[('ADMIN', 'Administrador'), ('VETERINARIAN', 'Veterinario')], default='VETERINARIAN', max_length=20)),
                ('linked_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de vínculo')),
                ('unlinked_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de desvinculación')),
                ('clinic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vet_clinics', to='clinics.clinic', verbose_name='Clínica')),
                ('veterinarian', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vet_clinics', to='users.user', verbose_name='Veterinario')),
            ],
            options={
                'verbose_name': 'Vínculo Veterinario-Clínica',
                'verbose_name_plural': 'Vínculos Veterinario-Clínica',
                'ordering': ['-linked_at'],
                'unique_together': {('veterinarian', 'clinic')},
            },
        ),
        migrations.CreateModel(
            name='ClinicAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('action', models.CharField(choices=[('LOGIN', 'Inicio de sesión'), ('LOGOUT', 'Cierre de sesión'), ('SELECT_CLINIC', 'Selección de clínica'), ('CREATE_PATIENT', 'Crear mascota'), ('UPDATE_PATIENT', 'Actualizar mascota'), ('VIEW_PATIENT', 'Ver mascota'), ('CREATE_MONITORING', 'Crear seguimiento'), ('SUBMIT_REPORT', 'Enviar reporte'), ('UPDATE_PROFILE', 'Actualizar perfil')], max_length=50, verbose_name='Acción')),
                ('details', models.JSONField(blank=True, default=dict, verbose_name='Detalles adicionales')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='Dirección IP')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User Agent')),
                ('timestamp', models.DateTimeField(auto_now_add=True, verbose_name='Timestamp')),
                ('clinic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audit_logs', to='clinics.clinic', verbose_name='Clínica')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clinic_audit_logs', to='users.user', verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Log de Auditoría de Clínica',
                'verbose_name_plural': 'Logs de Auditoría de Clínica',
                'ordering': ['-timestamp'],
            },
        ),
    ]
