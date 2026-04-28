from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import Game, Level
from .serializers import GameSerializer, LevelSerializer


class WriteThrottle(UserRateThrottle):
    scope = "writes"


class GameListView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def get(self, request):
        qs = Game.objects.filter(is_active=True)
        return Response(GameSerializer(qs, many=True).data)


def _get_active_game(slug):
    return get_object_or_404(Game, slug=slug, is_active=True)


class LevelListView(APIView):
    """GET = my levels for this game. POST = create."""

    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method == "POST":
            return [WriteThrottle()]
        return []

    def get(self, request, game_slug):
        game = _get_active_game(game_slug)
        qs = Level.objects.filter(game=game, user=request.user)
        return Response(LevelSerializer(qs, many=True).data)

    def post(self, request, game_slug):
        game = _get_active_game(game_slug)
        existing = Level.objects.filter(game=game, user=request.user).count()
        if existing >= game.max_levels_per_user:
            raise ValidationError(
                {"detail": f"Max {game.max_levels_per_user} levels reached for this game."}
            )
        serializer = LevelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        level = serializer.save(game=game, user=request.user)
        return Response(LevelSerializer(level).data, status=status.HTTP_201_CREATED)


class LevelDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [WriteThrottle()]
        return []

    def _get(self, request, game_slug, pk):
        return get_object_or_404(
            Level, pk=pk, game__slug=game_slug, game__is_active=True, user=request.user
        )

    def get(self, request, game_slug, pk):
        return Response(LevelSerializer(self._get(request, game_slug, pk)).data)

    def put(self, request, game_slug, pk):
        level = self._get(request, game_slug, pk)
        serializer = LevelSerializer(level, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, game_slug, pk):
        self._get(request, game_slug, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
