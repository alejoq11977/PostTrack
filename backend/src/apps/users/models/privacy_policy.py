from django.db import models
from apps.core.models import AuditableModel

class PrivacyPolicyVersion(models.Model):
    version = models.CharField(max_length=20, unique=True)
    content = models.TextField(help_text="Texto completo del aviso de privacidad")
    effective_date = models.DateField()
    is_active = models.BooleanField(
        default=False,
        help_text="Solo una versión puede estar activa a la vez"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Versión de Política de Privacidad"
        verbose_name_plural = "Privacy Policy Versions"
        ordering = ['-effective_date']

    def save(self, *args, **kwargs):
        if self.is_active:
            PrivacyPolicyVersion.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.version} ({'activa' if self.is_active else 'inactiva'})"