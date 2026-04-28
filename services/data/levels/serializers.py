from rest_framework import serializers

from .models import Game, Level


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ["slug", "name", "description", "url", "max_levels_per_user"]


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = [
            "id",
            "title",
            "description",
            "data",
            "schema_version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
