from django.conf import settings
from django.db import models


class Game(models.Model):
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    max_levels_per_user = models.PositiveIntegerField(default=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Level(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="levels")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="levels"
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    data = models.JSONField()
    schema_version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["game", "user"]),
            models.Index(fields=["game", "-updated_at"]),
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.game.slug}/{self.id} – {self.title}"
