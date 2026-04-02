"""Loopia XMLRPC API wrapper."""

import xmlrpc.client
from dataclasses import dataclass


@dataclass
class ZoneRecord:
    type: str
    ttl: int
    priority: int
    rdata: str
    record_id: int = 0

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "ttl": self.ttl,
            "priority": self.priority,
            "rdata": self.rdata,
            "record_id": self.record_id,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ZoneRecord":
        return cls(
            type=d["type"],
            ttl=d["ttl"],
            priority=d["priority"],
            rdata=d["rdata"],
            record_id=d["record_id"],
        )


class LoopiaAPI:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.client = xmlrpc.client.ServerProxy("https://api.loopia.se/RPCSERV")

    def _call(self, method: str, *args):
        fn = getattr(self.client, method)
        return fn(self.username, self.password, *args)

    def get_subdomains(self, domain: str) -> list[str]:
        return self._call("getSubdomains", domain)

    def add_subdomain(self, domain: str, subdomain: str) -> str:
        return self._call("addSubdomain", domain, subdomain)

    def remove_subdomain(self, domain: str, subdomain: str) -> str:
        return self._call("removeSubdomain", domain, subdomain)

    def get_zone_records(self, domain: str, subdomain: str) -> list[ZoneRecord]:
        result = self._call("getZoneRecords", domain, subdomain)
        if isinstance(result, str):
            return []
        return [ZoneRecord.from_dict(r) for r in result]

    def add_zone_record(self, domain: str, subdomain: str, record: ZoneRecord) -> str:
        return self._call("addZoneRecord", domain, subdomain, record.to_dict())

    def update_zone_record(self, domain: str, subdomain: str, record: ZoneRecord) -> str:
        return self._call("updateZoneRecord", domain, subdomain, record.to_dict())

    def remove_zone_record(self, domain: str, subdomain: str, record_id: int) -> str:
        return self._call("removeZoneRecord", domain, subdomain, record_id)
