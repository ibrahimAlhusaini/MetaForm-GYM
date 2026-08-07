"""Pseudonymization and analytical export privacy guards."""

from __future__ import annotations

import hashlib
import hmac
from collections.abc import Iterable

import pandas as pd

FORBIDDEN_EXPORT_COLUMNS = frozenset(
    {
        "user_id",
        "userid",
        "email",
        "password_hash",
        "passwordhash",
        "full_name",
        "fullname",
        "role",
        "refresh_token",
        "token_hash",
        "ip_address",
        "user_agent",
        "birth_date",
    }
)


def pseudonymize(identifier: object, *, domain: str, secret: str | None) -> str:
    """Return a stable domain-separated pseudonym, never the source identifier.

    HMAC is preferred. The unkeyed fallback is suitable only for disposable local
    analysis because UUID candidates can be guessed and checked offline.
    """
    message = f"metaform-ds:{domain}:{identifier}".encode()
    digest = (
        hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
        if secret
        else hashlib.sha256(message).hexdigest()
    )
    return f"anon_{digest[:24]}"


def pseudonymize_series(
    values: Iterable[object], *, domain: str, secret: str | None
) -> pd.Series:
    return pd.Series(
        [pseudonymize(value, domain=domain, secret=secret) for value in values],
        dtype="string",
    )


def assert_export_safe(frame: pd.DataFrame) -> None:
    """Reject known identity/authentication fields before artifact export."""
    normalized = {column.lower() for column in frame.columns}
    forbidden = sorted(normalized.intersection(FORBIDDEN_EXPORT_COLUMNS))
    if forbidden:
        raise ValueError(f"Unsafe analytical export columns: {', '.join(forbidden)}")
