"""Loopia DNS CLI — manage DNS records for sxa.se via Loopia API."""

import os
import subprocess
import sys

import typer

from .api import LoopiaAPI, ZoneRecord

app = typer.Typer(help="Manage DNS records via Loopia API")

DEFAULT_DOMAIN = "sxa.se"


def get_credentials() -> tuple[str, str]:
    user = os.environ.get("LOOPIA_USER")
    password = os.environ.get("LOOPIA_PASS")

    if not user or not password:
        sops_key = os.environ.get("SOPS_AGE_KEY_FILE")
        if not sops_key:
            typer.echo("Set LOOPIA_USER/LOOPIA_PASS or SOPS_AGE_KEY_FILE", err=True)
            raise typer.Exit(1)
        try:
            result = subprocess.run(
                ["sops", "-d", "secrets/loopia.sops.env"],
                capture_output=True, text=True, check=True,
            )
            for line in result.stdout.strip().splitlines():
                if "=" in line:
                    key, _, value = line.partition("=")
                    value = value.strip().strip('"')
                    if key.strip() == "LOOPIA_USER":
                        user = value
                    elif key.strip() == "LOOPIA_PASS":
                        password = value
        except (subprocess.CalledProcessError, FileNotFoundError):
            typer.echo("Failed to decrypt loopia credentials", err=True)
            raise typer.Exit(1)

    if not user or not password:
        typer.echo("Could not load Loopia credentials", err=True)
        raise typer.Exit(1)

    return user, password


def get_api() -> LoopiaAPI:
    user, password = get_credentials()
    return LoopiaAPI(user, password)


@app.command("list")
def list_subdomains(domain: str = typer.Argument(DEFAULT_DOMAIN)):
    """List all subdomains."""
    api = get_api()
    subs = api.get_subdomains(domain)
    for sub in sorted(subs):
        typer.echo(sub)


@app.command("records")
def list_records(
    subdomain: str = typer.Argument(...),
    domain: str = typer.Option(DEFAULT_DOMAIN, "--domain", "-d"),
):
    """List DNS records for a subdomain."""
    api = get_api()
    records = api.get_zone_records(domain, subdomain)
    if not records:
        typer.echo(f"No records for {subdomain}.{domain}")
        return
    for r in records:
        typer.echo(f"  [{r.record_id}] {r.type:6s} {r.rdata:40s} TTL={r.ttl} PRI={r.priority}")


@app.command("add")
def add_record(
    subdomain: str = typer.Argument(...),
    rdata: str = typer.Argument(..., help="Record data (e.g. IP address)"),
    type: str = typer.Option("A", "--type", "-t"),
    ttl: int = typer.Option(3600, "--ttl"),
    priority: int = typer.Option(0, "--priority", "-p"),
    domain: str = typer.Option(DEFAULT_DOMAIN, "--domain", "-d"),
    create_subdomain: bool = typer.Option(True, "--create-subdomain/--no-create-subdomain"),
):
    """Add a DNS record. Creates the subdomain if it doesn't exist."""
    api = get_api()

    if create_subdomain:
        subs = api.get_subdomains(domain)
        if subdomain not in subs:
            status = api.add_subdomain(domain, subdomain)
            typer.echo(f"Created subdomain {subdomain}.{domain}: {status}")

    record = ZoneRecord(type=type, ttl=ttl, priority=priority, rdata=rdata)
    status = api.add_zone_record(domain, subdomain, record)
    typer.echo(f"Added {type} record {subdomain}.{domain} → {rdata}: {status}")


@app.command("remove")
def remove_record(
    subdomain: str = typer.Argument(...),
    record_id: int = typer.Argument(..., help="Record ID (use 'records' to find it)"),
    domain: str = typer.Option(DEFAULT_DOMAIN, "--domain", "-d"),
):
    """Remove a DNS record by ID."""
    api = get_api()
    status = api.remove_zone_record(domain, subdomain, record_id)
    typer.echo(f"Removed record {record_id} from {subdomain}.{domain}: {status}")


@app.command("remove-subdomain")
def remove_subdomain(
    subdomain: str = typer.Argument(...),
    domain: str = typer.Option(DEFAULT_DOMAIN, "--domain", "-d"),
    force: bool = typer.Option(False, "--force", "-f"),
):
    """Remove a subdomain and all its records."""
    if not force:
        typer.confirm(f"Remove {subdomain}.{domain} and all its records?", abort=True)
    api = get_api()
    status = api.remove_subdomain(domain, subdomain)
    typer.echo(f"Removed {subdomain}.{domain}: {status}")


if __name__ == "__main__":
    app()
