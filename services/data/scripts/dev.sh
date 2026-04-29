#!/usr/bin/env bash
# Local dev runner for sxa-data.
# Uses sqlite, DEBUG=on, CORS open for the local Vite dev server (:5173).
# Login flow: visit http://localhost:8000/admin/ to sign in with the dev superuser,
# the session cookie is then accepted by /api/whoami/ and the rest of the API.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

export DJANGO_DEBUG=1
export DJANGO_DB=sqlite
export DJANGO_SECRET_KEY="dev-insecure-change-me"
export DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1"
export CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
export DJANGO_CSRF_TRUSTED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
export LOGIN_REDIRECT_URL="http://localhost:5173/"
export LOGOUT_REDIRECT_URL="http://localhost:5173/"

.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py shell <<'PY'
from django.contrib.auth import get_user_model
from levels.models import Game

Game.objects.get_or_create(
    slug="starsandcomets",
    defaults={"name": "Stars & Comets", "url": "http://localhost:5173"},
)

User = get_user_model()
if not User.objects.filter(username="dev").exists():
    User.objects.create_superuser("dev", "dev@local", "dev")
    print("Created superuser: username=dev password=dev")
PY

exec .venv/bin/python manage.py runserver 0.0.0.0:8000
