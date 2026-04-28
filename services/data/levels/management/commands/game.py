from django.core.management.base import BaseCommand, CommandError

from levels.models import Game


class Command(BaseCommand):
    help = "Manage Game records (list, create, update, activate, deactivate)"

    def add_arguments(self, parser):
        sub = parser.add_subparsers(dest="action", required=True)

        sub.add_parser("list", help="List all games")

        p = sub.add_parser("create", help="Create a game")
        p.add_argument("slug")
        p.add_argument("--name", required=True)
        p.add_argument("--description", default="")
        p.add_argument("--url", default="")
        p.add_argument("--max-levels", type=int, default=200, dest="max_levels")

        p = sub.add_parser("update", help="Update fields on a game")
        p.add_argument("slug")
        p.add_argument("--name")
        p.add_argument("--description")
        p.add_argument("--url")
        p.add_argument("--max-levels", type=int, dest="max_levels")

        for action in ("activate", "deactivate"):
            p = sub.add_parser(action, help=f"{action.capitalize()} a game")
            p.add_argument("slug")

    def handle(self, *args, action, **opts):
        getattr(self, f"_{action}")(**opts)

    # ------------------------------------------------------------------ list
    def _list(self, **_):
        games = Game.objects.all().order_by("slug")
        if not games:
            self.stdout.write("(no games)")
            return
        self.stdout.write(f"{'slug':<20} {'active':<7} {'cap':<5} {'name':<25} url")
        self.stdout.write("-" * 80)
        for g in games:
            self.stdout.write(
                f"{g.slug:<20} {str(g.is_active):<7} {g.max_levels_per_user:<5} "
                f"{g.name:<25} {g.url}"
            )

    # ---------------------------------------------------------------- create
    def _create(self, *, slug, name, description, url, max_levels, **_):
        if Game.objects.filter(slug=slug).exists():
            raise CommandError(f"Game with slug '{slug}' already exists")
        g = Game.objects.create(
            slug=slug,
            name=name,
            description=description,
            url=url,
            max_levels_per_user=max_levels,
        )
        self.stdout.write(self.style.SUCCESS(f"Created: {g.slug} ({g.name})"))

    # ---------------------------------------------------------------- update
    def _update(self, *, slug, **opts):
        try:
            g = Game.objects.get(slug=slug)
        except Game.DoesNotExist:
            raise CommandError(f"No game with slug '{slug}'")
        changed = []
        for field in ("name", "description", "url", "max_levels"):
            v = opts.get(field)
            if v is None:
                continue
            attr = "max_levels_per_user" if field == "max_levels" else field
            setattr(g, attr, v)
            changed.append(f"{attr}={v!r}")
        if not changed:
            self.stdout.write("Nothing to update.")
            return
        g.save()
        self.stdout.write(self.style.SUCCESS(f"Updated {g.slug}: {', '.join(changed)}"))

    # ------------------------------------------------------------ (de)activate
    def _activate(self, *, slug, **_):
        self._set_active(slug, True)

    def _deactivate(self, *, slug, **_):
        self._set_active(slug, False)

    def _set_active(self, slug, value):
        n = Game.objects.filter(slug=slug).update(is_active=value)
        if not n:
            raise CommandError(f"No game with slug '{slug}'")
        self.stdout.write(
            self.style.SUCCESS(
                f"{'Activated' if value else 'Deactivated'}: {slug}"
            )
        )
