from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse, JsonResponse


INDEX_HTML = """<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <title>data.sxa.se</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.4rem; margin: 0 0 1rem; }
    code { background: #f3f3f3; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.9em; }
    a { color: #06c; }
    ul { padding-left: 1.2rem; }
  </style>
</head>
<body>
  <h1>data.sxa.se</h1>
  <p>Backend för spel under <code>*.sxa.se</code>: spara levels, hantera spel, social login.</p>
  <ul>
    <li><a href="/admin/">/admin/</a> — administration</li>
    <li><a href="/api/health/">/api/health/</a> — liveness</li>
    <li><a href="/api/games/">/api/games/</a> — registrerade spel</li>
  </ul>
</body>
</html>"""


def index(_request):
    return HttpResponse(INDEX_HTML)


def health(_request):
    return JsonResponse({"ok": True})


def whoami(request):
    u = request.user
    if not u.is_authenticated:
        return JsonResponse({"authenticated": False})
    return JsonResponse({
        "authenticated": True,
        "id": u.id,
        "email": u.email,
        "username": u.username,
    })


urlpatterns = [
    path("", index),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/health/", health),
    path("api/whoami/", whoami),
    path("api/", include("levels.urls")),
]
