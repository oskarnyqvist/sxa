from django.urls import path

from . import views

urlpatterns = [
    path("games/", views.GameListView.as_view()),
    path("games/<slug:game_slug>/levels/", views.LevelListView.as_view()),
    path("games/<slug:game_slug>/levels/<int:pk>/", views.LevelDetailView.as_view()),
]
