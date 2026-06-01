from django import forms
from django.contrib import admin, messages
from unfold.admin import ModelAdmin
from firebase_admin import auth
from .models import User
import logging
from apps.users.models.privacy_policy import PrivacyPolicyVersion
from apps.core.services.email import send_activation_email

logger = logging.getLogger(__name__)

class UserAdminForm(forms.ModelForm):
    new_password = forms.CharField(
        label='Contraseña',
        widget=forms.PasswordInput(),
        required=False,
        help_text=(
            "Opcional. Si la dejas vacía al crear un usuario nuevo, se le enviará "
            "un correo para que active su cuenta y elija su propia contraseña "
            "(recomendado para veterinarios)."
        ),
    )

    class Meta:
        model = User
        exclude = ('password', 'last_login', 'groups', 'user_permissions', 'is_superuser')

@admin.register(User)
class UserAdmin(ModelAdmin):
    form = UserAdminForm

    list_display = ('email', 'full_name', 'role', 'is_active', 'terms_accepted_at')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'full_name', 'identification_number', 'phone_number')
    ordering = ('-created_at',)
    actions = ['resend_activation_email_action']

    @admin.action(description="Reenviar correo de activación")
    def resend_activation_email_action(self, request, queryset):
        """Reenvía el correo de activación a los usuarios seleccionados (útil si
        el link expiró o el destinatario lo perdió)."""
        sent = 0
        failed = 0
        for user in queryset:
            if not user.email:
                failed += 1
                continue
            try:
                if send_activation_email(user):
                    sent += 1
                else:
                    failed += 1
            except Exception as exc:
                logger.error(f"Error reenviando activación a {user.email}: {exc}")
                failed += 1
        if sent:
            messages.success(
                request,
                f"Correo de activación reenviado a {sent} usuario(s)."
            )
        if failed:
            messages.warning(
                request,
                f"No se pudo enviar a {failed} usuario(s). Revisa la config de Brevo o los logs."
            )
    
    readonly_fields = (
        'firebase_uid', 
        'terms_accepted_at', 
        'terms_accepted_ip', 
        'terms_accepted_version',
        'created_at',
        'updated_at'
    )

    fieldsets = (
        ('Información Personal', {
            'fields': ('email', 'new_password', 'full_name', 'identification_number', 'phone_number', 'address')
        }),
        ('Permisos y Roles', {
            'fields': ('role', 'managed_by', 'is_active', 'is_staff', 'password_changed')
        }),
        ('Ley 1581 (Habeas Data) y Sistema', {
            'fields': ('firebase_uid', 'terms_accepted_at', 'terms_accepted_ip', 'terms_accepted_version', 'created_at', 'updated_at'),
            'classes': ('collapse',) 
        }),
    )

    def save_model(self, request, obj, form, change):
        raw_password = form.cleaned_data.get('new_password')
        send_activation = False  # se decide abajo si toca enviar correo

        if raw_password:
            obj.set_password(raw_password)

            if not change:
                try:
                    firebase_user = auth.create_user(
                        email=obj.email,
                        password=raw_password,
                        display_name=obj.full_name,
                    )
                    obj.firebase_uid = firebase_user.uid
                    logger.info(f"Usuario {obj.email} creado en Firebase desde el Admin.")

                except auth.EmailAlreadyExistsError:
                    logger.warning(f"El correo {obj.email} ya existe en Firebase. Intentando recuperar...")
                    firebase_user = auth.get_user_by_email(obj.email)
                    obj.firebase_uid = firebase_user.uid
                    try:
                        auth.update_user(
                            firebase_user.uid,
                            password=raw_password,
                            disabled=False
                        )
                        logger.info(f"Cuenta zombie {obj.email} recuperada, habilitada y clave actualizada.")
                    except Exception as inner_e:
                        logger.error(f"Error recuperando cuenta zombie en Firebase: {inner_e}")

                except Exception as e:
                    logger.error(f"Error creando en Firebase: {e}")
            else:
                if obj.firebase_uid:
                    try:
                        auth.update_user(obj.firebase_uid, password=raw_password)
                        logger.info(f"Contraseña de {obj.email} actualizada en Firebase desde el Admin.")
                    except Exception as e:
                        logger.error(f"Error actualizando clave en Firebase: {e}")

        elif not change:
            # Usuario nuevo SIN contraseña: lo creamos en Firebase sin password
            # y le mandamos el correo de activación para que ponga la suya.
            obj.set_unusable_password()
            try:
                firebase_user = auth.create_user(
                    email=obj.email,
                    display_name=obj.full_name or None,
                )
                obj.firebase_uid = firebase_user.uid
                send_activation = True
                logger.info(f"Usuario {obj.email} creado en Firebase (sin contraseña) desde el Admin.")
            except auth.EmailAlreadyExistsError:
                logger.warning(f"El correo {obj.email} ya existe en Firebase. Reutilizando para activación.")
                firebase_user = auth.get_user_by_email(obj.email)
                obj.firebase_uid = firebase_user.uid
                try:
                    auth.update_user(firebase_user.uid, disabled=False)
                except Exception:
                    pass
                send_activation = True
            except Exception as e:
                logger.error(f"Error creando en Firebase: {e}")
                messages.error(request, f"No se pudo crear el usuario en Firebase: {e}")

        if change and obj.firebase_uid:
            try:
                auth.update_user(obj.firebase_uid, disabled=not obj.is_active)
            except Exception as e:
                logger.error(f"Error sincronizando is_active en Firebase: {e}")

        super().save_model(request, obj, form, change)

        # Después de guardar (ya con obj.pk), enviamos el correo de activación.
        if send_activation:
            ok = send_activation_email(obj)
            if ok:
                messages.success(
                    request,
                    f"Se envió el correo de activación a {obj.email}."
                )
            else:
                messages.warning(
                    request,
                    f"El usuario quedó creado, pero el correo de activación no se pudo enviar "
                    f"(revisa la config de Brevo o los logs). Email: {obj.email}."
                )

    def delete_model(self, request, obj):
        if obj.firebase_uid:
            try:
                auth.delete_user(obj.firebase_uid)
                logger.info(f"Usuario {obj.email} eliminado físicamente de Firebase Auth.")
            except Exception as e:
                logger.warning(f"No se pudo eliminar de Firebase o ya no existía: {e}")
        
        super().delete_model(request, obj)


@admin.register(PrivacyPolicyVersion)
class PrivacyPolicyVersionAdmin(ModelAdmin): 
    list_display = ('version', 'effective_date', 'is_active', 'created_at')
    list_filter = ('is_active',)
    readonly_fields = ('created_at',)