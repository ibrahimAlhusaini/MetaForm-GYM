from __future__ import annotations

import pandas as pd
import pytest

from metaform_ds.config import ConfigurationError, DataScienceConfig
from metaform_ds.db import assert_select_only
from metaform_ds.utils.privacy import assert_export_safe, pseudonymize


def test_missing_database_url_is_safe_until_extraction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DATA_SCIENCE_DATABASE_URL", raising=False)
    config = DataScienceConfig.from_env()
    assert config.database_url is None
    with pytest.raises(ConfigurationError, match="required"):
        config.require_database_url()


def test_non_postgresql_url_is_rejected() -> None:
    with pytest.raises(ConfigurationError, match="PostgreSQL"):
        DataScienceConfig(database_url="sqlite:///unsafe.db").require_database_url()


def test_pseudonymization_is_stable_and_domain_separated() -> None:
    first = pseudonymize("uuid-1", domain="user", secret="test-secret")
    assert first == pseudonymize("uuid-1", domain="user", secret="test-secret")
    assert first != pseudonymize("uuid-2", domain="user", secret="test-secret")
    assert first != pseudonymize("uuid-1", domain="session", secret="test-secret")
    assert "uuid-1" not in first


def test_raw_identifiers_cannot_be_exported() -> None:
    with pytest.raises(ValueError, match="Unsafe"):
        assert_export_safe(pd.DataFrame({"user_id": ["raw-uuid"]}))
    assert_export_safe(pd.DataFrame({"anonymous_user_id": ["anon_value"]}))


@pytest.mark.parametrize(
    "sql",
    [
        'INSERT INTO "User" VALUES (1)',
        'WITH x AS (SELECT 1) DELETE FROM "User"',
        'SELECT 1; DROP TABLE "User"',
        'UPDATE "Profile" SET "fullName" = \'x\'',
    ],
)
def test_database_boundary_rejects_write_paths(sql: str) -> None:
    with pytest.raises(ValueError):
        assert_select_only(sql)


def test_database_boundary_accepts_select_and_cte() -> None:
    assert_select_only("SELECT 1")
    assert_select_only("WITH values AS (SELECT 1) SELECT * FROM values")
