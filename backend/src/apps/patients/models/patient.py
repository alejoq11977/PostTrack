from django.db import models
from apps.core.models import AuditableModel

class Patient(AuditableModel):
    owner = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE, 
        related_name='patients'
    )
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)
    breed = models.CharField(max_length=100)
    birth_date = models.DateField()
    current_weight = models.FloatField(help_text="Weight in kg")
    photo_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL pública de la imagen (ImgBB)")

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def __str__(self):
        return f"{self.name} - {self.species}"