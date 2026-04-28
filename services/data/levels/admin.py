from django.contrib import admin

from .models import Game, Level


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("slug", "name", "is_active", "max_levels_per_user", "url", "created_at")
    list_filter = ("is_active",)
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("slug", "name")


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ("id", "game", "user", "title", "schema_version", "updated_at")
    list_filter = ("game", "schema_version")
    search_fields = ("title", "description", "user__email")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)
