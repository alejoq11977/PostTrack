from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_identification_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='identification_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
