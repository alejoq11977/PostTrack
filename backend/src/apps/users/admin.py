from django.contrib import admin
from unfold.admin import ModelAdmin
from firebase_admin import auth
from .models import User
import logging

logger = logging.getLogger(__name__)

@admin.register(User)
class UserAdmin(ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'password_changed')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'full_name', 'identification_number')
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            raw_password = form.cleaned_data.get('password')
            
            if raw_password:
                try:
                    firebase_user = auth.create_user(
                        email=obj.email,
                        password=raw_password,
                        display_name=obj.full_name,
                    )
                    obj.firebase_uid = firebase_user.uid
                    logger.info(f"Usuario {obj.email} creado en Firebase desde el Admin.")
                except auth.EmailAlreadyExistsError:
                    firebase_user = auth.get_user_by_email(obj.email)
                    obj.firebase_uid = firebase_user.uid
                except Exception as e:
                    logger.error(f"Error creando en Firebase: {e}")
                    
        super().save_model(request, obj, form, change)