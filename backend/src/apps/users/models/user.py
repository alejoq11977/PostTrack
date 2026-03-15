from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.core.models import AuditableModel

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    VETERINARIAN = 'VETERINARIAN', 'Veterinarian'
    OWNER = 'OWNER', 'Owner'

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, AuditableModel):
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    identification_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.OWNER)
    password_changed = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} ({self.role})"