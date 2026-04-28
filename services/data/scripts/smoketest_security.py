"""Verify security additions: is_active, max_levels_per_user, payload size, throttling.

Assumes a fresh dev server on 127.0.0.1:8765 with admin/admin12345.
"""
import json
import sys

import requests

BASE = "http://127.0.0.1:8765"
GAME = "starsandcomets"


def login(s):
    s.get(f"{BASE}/admin/login/")
    csrf = s.cookies["csrftoken"]
    r = s.post(
        f"{BASE}/admin/login/",
        data={"username": "admin", "password": "admin12345",
              "csrfmiddlewaretoken": csrf, "next": "/admin/"},
        headers={"Referer": f"{BASE}/admin/login/"},
        allow_redirects=False,
    )
    assert r.status_code == 302, f"login failed: {r.status_code}"


def csrf_headers(s):
    return {"X-CSRFToken": s.cookies["csrftoken"], "Referer": BASE}


def section(t):
    print(f"\n=== {t} ===")


def main():
    s = requests.Session()
    login(s)

    section("1. Payload too large (276 KB) → 400")
    big = {"data": {"blob": "x" * 280_000}}
    r = s.post(f"{BASE}/api/games/{GAME}/levels/", json=big, headers=csrf_headers(s))
    print(f"status: {r.status_code}")
    assert r.status_code == 400, "expected 400 for oversized body"

    section("2. Normal create still works")
    r = s.post(
        f"{BASE}/api/games/{GAME}/levels/",
        json={"title": "ok", "data": {"foo": "bar"}},
        headers=csrf_headers(s),
    )
    print(r.status_code, r.json().get("id"))
    assert r.status_code == 201
    created_id = r.json()["id"]

    section("3. Inactive game hides from /api/games/ and rejects writes")
    # Mark game inactive via Django shell-equivalent: do it through admin? Use API? No admin REST.
    # Easiest: deactivate via the admin page — but here we'll just call manage.py shell via subprocess.
    import subprocess
    subprocess.run(
        ["./.venv/bin/python", "manage.py", "shell", "-c",
         "from levels.models import Game; Game.objects.filter(slug='starsandcomets').update(is_active=False)"],
        env={"PATH": "/usr/bin:/bin", "DJANGO_DB": "sqlite", "DJANGO_DEBUG": "1"},
        check=True,
    )
    r = s.get(f"{BASE}/api/games/")
    print(f"games list with inactive game: {r.json()}")
    assert r.json() == []

    r = s.post(
        f"{BASE}/api/games/{GAME}/levels/",
        json={"title": "should fail", "data": {}},
        headers=csrf_headers(s),
    )
    print(f"create on inactive game: {r.status_code}")
    assert r.status_code == 404

    # reactivate
    subprocess.run(
        ["./.venv/bin/python", "manage.py", "shell", "-c",
         "from levels.models import Game; Game.objects.filter(slug='starsandcomets').update(is_active=True, max_levels_per_user=3)"],
        env={"PATH": "/usr/bin:/bin", "DJANGO_DB": "sqlite", "DJANGO_DEBUG": "1"},
        check=True,
    )

    section("4. max_levels_per_user enforced")
    # We already have `created_id` plus what existed before. Set limit to 3 above.
    # Find current count and create until limit, then expect 400.
    cur = s.get(f"{BASE}/api/games/{GAME}/levels/").json()
    print(f"current count: {len(cur)}")
    while len(cur) < 3:
        r = s.post(
            f"{BASE}/api/games/{GAME}/levels/",
            json={"title": f"fill-{len(cur)}", "data": {}},
            headers=csrf_headers(s),
        )
        assert r.status_code == 201, r.text
        cur = s.get(f"{BASE}/api/games/{GAME}/levels/").json()
    r = s.post(
        f"{BASE}/api/games/{GAME}/levels/",
        json={"title": "one too many", "data": {}},
        headers=csrf_headers(s),
    )
    print(f"over limit: {r.status_code} {r.text[:200]}")
    assert r.status_code == 400
    assert "Max 3 levels" in r.text

    # Cleanup the levels we created so re-runs work
    for lv in s.get(f"{BASE}/api/games/{GAME}/levels/").json():
        s.delete(f"{BASE}/api/games/{GAME}/levels/{lv['id']}/", headers=csrf_headers(s))
    # restore default cap
    subprocess.run(
        ["./.venv/bin/python", "manage.py", "shell", "-c",
         "from levels.models import Game; Game.objects.filter(slug='starsandcomets').update(max_levels_per_user=200)"],
        env={"PATH": "/usr/bin:/bin", "DJANGO_DB": "sqlite", "DJANGO_DEBUG": "1"},
        check=True,
    )

    section("5. Write throttle (60/min) — burst 65 writes, expect some 429s")
    hits = {201: 0, 429: 0, "other": 0}
    for i in range(65):
        r = s.post(
            f"{BASE}/api/games/{GAME}/levels/",
            json={"title": f"burst-{i}", "data": {"i": i}},
            headers=csrf_headers(s),
        )
        if r.status_code == 201:
            hits[201] += 1
        elif r.status_code == 429:
            hits[429] += 1
        else:
            hits["other"] += 1
    print(hits)
    assert hits[429] >= 1, "expected at least one throttled response"

    # cleanup again
    for lv in s.get(f"{BASE}/api/games/{GAME}/levels/").json():
        s.delete(f"{BASE}/api/games/{GAME}/levels/{lv['id']}/", headers=csrf_headers(s))

    print("\n✓ security smoketest passed")


if __name__ == "__main__":
    main()
