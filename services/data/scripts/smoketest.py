"""End-to-end smoketest against a running dev server.

Runs as: DJANGO_DB=sqlite python scripts/smoketest.py
Assumes server is on 127.0.0.1:8765, superuser admin/admin12345 exists,
and a Game with slug=starsandcomets exists.
"""
import json
import sys

import requests

BASE = "http://127.0.0.1:8765"
GAME = "starsandcomets"


def banner(s):
    print(f"\n=== {s} ===")


def show(label, r):
    body = r.text
    try:
        body = json.dumps(r.json(), indent=2, ensure_ascii=False)
    except Exception:
        pass
    print(f"{label}: {r.status_code}\n{body}")


def main():
    s = requests.Session()

    banner("Public: health + games (no auth)")
    show("GET /api/health/", s.get(f"{BASE}/api/health/"))
    show("GET /api/games/", s.get(f"{BASE}/api/games/"))

    banner("whoami before login")
    show("GET /api/whoami/", s.get(f"{BASE}/api/whoami/"))

    banner("Login via /admin/login/")
    s.get(f"{BASE}/admin/login/")
    csrf = s.cookies["csrftoken"]
    r = s.post(
        f"{BASE}/admin/login/",
        data={
            "username": "admin",
            "password": "admin12345",
            "csrfmiddlewaretoken": csrf,
            "next": "/admin/",
        },
        headers={"Referer": f"{BASE}/admin/login/"},
        allow_redirects=False,
    )
    print(f"login status: {r.status_code} (302 = success, 200 = form re-render = bad creds)")
    if r.status_code != 302:
        print("LOGIN FAILED")
        sys.exit(1)
    print(f"sessionid present: {'sessionid' in s.cookies}")

    def headers():
        return {"X-CSRFToken": s.cookies["csrftoken"], "Referer": BASE}

    banner("whoami after login")
    show("GET /api/whoami/", s.get(f"{BASE}/api/whoami/"))

    banner("List my levels (should be empty)")
    show(
        f"GET /api/games/{GAME}/levels/",
        s.get(f"{BASE}/api/games/{GAME}/levels/"),
    )

    banner("Create level")
    r = s.post(
        f"{BASE}/api/games/{GAME}/levels/",
        json={
            "title": "Lugn morgon",
            "description": "Två stjärnor, en komet",
            "data": {"stars": [{"x": 0, "y": 0, "mass": 100}], "comets": []},
        },
        headers=headers(),
    )
    show("POST", r)
    level_id = r.json()["id"]

    banner("List again (1 item)")
    show(
        f"GET /api/games/{GAME}/levels/",
        s.get(f"{BASE}/api/games/{GAME}/levels/"),
    )

    banner("Get level by id")
    show(
        f"GET /api/games/{GAME}/levels/{level_id}/",
        s.get(f"{BASE}/api/games/{GAME}/levels/{level_id}/"),
    )

    banner("Partial update (title only)")
    r = s.put(
        f"{BASE}/api/games/{GAME}/levels/{level_id}/",
        json={"title": "Lugn morgon (v2)"},
        headers=headers(),
    )
    show("PUT", r)

    banner("Wrong game slug → 404")
    show(
        "GET /api/games/no-such-game/levels/",
        s.get(f"{BASE}/api/games/no-such-game/levels/"),
    )

    banner("Unknown id → 404")
    show(
        f"GET /api/games/{GAME}/levels/99999/",
        s.get(f"{BASE}/api/games/{GAME}/levels/99999/"),
    )

    banner("Delete")
    show(
        f"DELETE /api/games/{GAME}/levels/{level_id}/",
        s.delete(
            f"{BASE}/api/games/{GAME}/levels/{level_id}/", headers=headers()
        ),
    )

    banner("Verify gone")
    show(
        f"GET /api/games/{GAME}/levels/{level_id}/",
        s.get(f"{BASE}/api/games/{GAME}/levels/{level_id}/"),
    )

    banner("Logout-ish: new session has no auth")
    s2 = requests.Session()
    show("GET /api/whoami/ (fresh)", s2.get(f"{BASE}/api/whoami/"))
    show(
        f"GET /api/games/{GAME}/levels/ (fresh, should be 403)",
        s2.get(f"{BASE}/api/games/{GAME}/levels/"),
    )

    print("\n✓ smoketest completed")


if __name__ == "__main__":
    main()
