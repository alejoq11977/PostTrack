from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    Clinic, ClinicMembership, DataPolicy,
    DataAuthorization, DataTreatmentAcceptance, ClinicAuditLog
)


@admin.register(Clinic)
class ClinicAdmin(ModelAdmin):
    list_display = ['name', 'nit', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'nit', 'email']
    ordering = ['name']


@admin.register(ClinicMembership)
class ClinicMembershipAdmin(ModelAdmin):
    list_display = ['user', 'role', 'clinic', 'is_active', 'linked_at', 'unlinked_at']
    list_filter = ['is_active', 'role', 'clinic']
    search_fields = ['user__full_name', 'user__email', 'full_name', 'identification_number', 'clinic__name']
    autocomplete_fields = ['user', 'clinic']
    ordering = ['-linked_at']

    fieldsets = (
        ('Vínculo', {
            'fields': ('user', 'role', 'clinic', 'is_active')
        }),
        ('Perfil en esta clínica', {
            'fields': ('full_name', 'identification_type', 'identification_number', 'phone_number', 'address')
        }),
    )

    readonly_fields = ['linked_at', 'unlinked_at']

    actions = ['unlink_members']

    @admin.action(description='Desvincular miembros seleccionados')
    def unlink_members(self, request, queryset):
        for membership in queryset.filter(is_active=True):
            membership.unlink()
        self.message_user(request, f"{queryset.filter(is_active=True).count()} miembro(s) desvinculado(s).")


@admin.register(DataPolicy)
class DataPolicyAdmin(ModelAdmin):
    list_display = ['clinic', 'version', 'effective_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'clinic']
    search_fields = ['clinic__name', 'version']
    ordering = ['-effective_date']

    actions = ['activate_policies']

    @admin.action(description='Activar políticas seleccionadas')
    def activate_policies(self, request, queryset):
        for policy in queryset:
            policy.is_active = True
            policy.save()
        self.message_user(request, f"{queryset.count()} política(s) activada(s).")


@admin.register(DataAuthorization)
class DataAuthorizationAdmin(ModelAdmin):
    list_display = ['clinic', 'version', 'effective_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'clinic']
    search_fields = ['clinic__name', 'version']
    ordering = ['-effective_date']

    actions = ['activate_authorizations']

    @admin.action(description='Activar autorizaciones seleccionadas')
    def activate_authorizations(self, request, queryset):
        for auth in queryset:
            auth.is_active = True
            auth.save()
        self.message_user(request, f"{queryset.count()} autorización(es) activada(s).")


@admin.register(DataTreatmentAcceptance)
class DataTreatmentAcceptanceAdmin(ModelAdmin):
    list_display = ['user', 'clinic', 'accepted_at', 'policy_version', 'authorization_version']
    list_filter = ['clinic', 'policy_version', 'authorization_version']
    search_fields = ['user__full_name', 'user__email', 'clinic__name']
    readonly_fields = ['user', 'clinic', 'accepted_at', 'ip_address', 'user_agent', 'policy_version', 'authorization_version']
    ordering = ['-accepted_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ClinicAuditLog)
class ClinicAuditLogAdmin(ModelAdmin):
    list_display = ['timestamp', 'user', 'clinic', 'action', 'ip_address']
    list_filter = ['action', 'clinic', 'timestamp']
    search_fields = ['user__full_name', 'user__email', 'clinic__name']
    readonly_fields = ['clinic', 'user', 'action', 'details', 'ip_address', 'user_agent', 'timestamp']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
