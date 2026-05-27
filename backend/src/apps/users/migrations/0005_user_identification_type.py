# Generated manually on 2026-05-11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_privacypolicyversion_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='identification_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('CC', 'Cédula de Ciudadanía'),
                    ('CE', 'Cédula de Extranjería'),
                    ('PA', 'Pasaporte'),
                    ('PEP', 'Permiso Especial')
                ],
                help_text='Tipo de documento de identificación',
                max_length=3,
                null=True
            ),
        ),
    ]