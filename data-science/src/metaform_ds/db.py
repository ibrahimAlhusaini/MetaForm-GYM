"""The only database boundary: PostgreSQL, explicit SQL, and read-only transactions."""

from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import pandas as pd
from sqlalchemy import Engine, create_engine, text

from metaform_ds.config import DataScienceConfig

_WRITE_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|MERGE|GRANT|REVOKE|CALL|COPY)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True, slots=True)
class ReadOnlyVerification:
    """Safe connection facts that contain no URL or server credentials."""

    connection_succeeded: bool
    select_succeeded: bool
    transaction_read_only: bool

    @property
    def verified(self) -> bool:
        return (
            self.connection_succeeded
            and self.select_succeeded
            and self.transaction_read_only
        )


def assert_select_only(sql: str) -> None:
    """Fail closed for anything outside a single SELECT/CTE statement."""
    normalized = sql.strip()
    if not normalized or not re.match(r"^(SELECT|WITH)\b", normalized, re.I):
        raise ValueError("Analytics SQL must begin with SELECT or WITH")
    if ";" in normalized.rstrip(";"):
        raise ValueError("Multiple SQL statements are not allowed")
    if _WRITE_KEYWORDS.search(normalized):
        raise ValueError("Write or DDL keyword detected in analytics SQL")


def create_read_only_engine(config: DataScienceConfig) -> Engine:
    """Create a pooled engine; permissions should also be SELECT-only in PostgreSQL."""
    return create_engine(
        config.require_database_url(),
        pool_pre_ping=True,
        connect_args={"options": "-c default_transaction_read_only=on"},
    )


def read_dataframe(
    engine: Engine, sql: str, parameters: Mapping[str, Any] | None = None
) -> pd.DataFrame:
    """Execute one explicit SELECT in a database-enforced read-only transaction."""
    assert_select_only(sql)
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text("SET TRANSACTION READ ONLY"))
            frame = pd.read_sql_query(text(sql), connection, params=parameters or {})
        finally:
            transaction.rollback()
    return frame


def verify_read_only_connection(engine: Engine) -> ReadOnlyVerification:
    """Verify connectivity and PostgreSQL read-only mode without attempting a write."""
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(text("SET TRANSACTION READ ONLY"))
            select_value = connection.execute(text("SELECT 1")).scalar_one()
            read_only_value = connection.execute(
                text("SELECT current_setting('transaction_read_only')")
            ).scalar_one()
        finally:
            transaction.rollback()
    return ReadOnlyVerification(
        connection_succeeded=True,
        select_succeeded=select_value == 1,
        transaction_read_only=str(read_only_value).lower() == "on",
    )
