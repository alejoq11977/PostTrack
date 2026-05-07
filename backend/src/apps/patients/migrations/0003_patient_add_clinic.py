from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0002_patient_photo_url'),
        ('clinics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='clinic',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='patients',
                to='clinics.clinic',
                help_text='Clínica donde está registrada la mascota'
            ),
        ),
        migrations.AddConstraint(
            model_name='patient',
            constraint=models.UniqueConstraint(
                condition=models.Q(clinic__isnull=False),
                fields=['name', 'species', 'breed', 'birth_date', 'owner', 'clinic'],
                name='unique_patient_per_clinic'
            ),
        ),
    ]
