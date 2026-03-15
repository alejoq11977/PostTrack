# backend/src/apps/users/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import User

@admin.register(User)
class UserAdmin(ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'terms_accepted_at')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'full_name', 'identification_number')
    ordering = ('-created_at',)