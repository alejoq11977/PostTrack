# backend/src/apps/users/admin.py
from django import forms
from django.contrib import admin
from unfold.admin import ModelAdmin
from firebase_admin import auth
from .models import User
import logging

logger = logging.getLogger(__name__)

class UserAdminForm(forms.ModelForm):
    new_password = forms.CharField(
        label='Contraseña',
        widget=forms.PasswordInput(),
        required=False,
        help_text="Requerida solo al crear un usuario nuevo. Después de guardada, no se podrá ver por seguridad."
    )

    class Meta:
        model = User
        exclude = ('password', 'firebase_uid', 'terms_accepted_at', 'last_login', 'groups', 'user_permissions', 'is_superuser')

    def clean(self):
        cleaned_data = super().clean()
        if not self.instance.pk and not cleaned_data.get('new_password'):
            self.add_error('new_password', 'La contraseña es obligatoria al crear un nuevo usuario.')
        return cleaned_data

@admin.register(User)
class UserAdmin(ModelAdmin):
    form = UserAdminForm 
    
    list_display = ('email', 'full_name', 'identification_number', 'role', 'is_active', 'password_changed')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'full_name', 'identification_number')
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        raw_password = form.cleaned_data.get('new_password')

        if not change and raw_password:
            
            obj.set_password(raw_password)

            # === CREACIÓN EN FIREBASE ===
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