"""Runtime settings read from the environment injected by the credential runner."""

import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    firecrawl_api_key: str | None
    reoon_api_key: str | None


def load_settings() -> Settings:
    missing = [name for name in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(name)]
    if missing:
        raise ConfigError(f"missing required variables: {', '.join(missing)}")
    return Settings(
        supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        firecrawl_api_key=os.environ.get("FIRECRAWL_API_KEY") or None,
        reoon_api_key=os.environ.get("REOON_API_KEY") or None,
    )


def require(value: str | None, name: str) -> str:
    if not value:
        raise ConfigError(f"missing required variable: {name}")
    return value
