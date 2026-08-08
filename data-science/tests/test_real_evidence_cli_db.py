from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from metaform_ds.config import DataScienceConfig
from metaform_ds.db import verify_read_only_connection
from metaform_ds.real_evidence import (
    RealEvidenceExecutionError,
    main,
    run_real_evidence,
)


def test_read_only_verification_uses_selects_and_rolls_back() -> None:
    engine = MagicMock()
    connection = engine.connect.return_value.__enter__.return_value
    transaction = connection.begin.return_value
    first_result = MagicMock()
    first_result.scalar_one.return_value = 1
    second_result = MagicMock()
    second_result.scalar_one.return_value = "on"
    connection.execute.side_effect = [MagicMock(), first_result, second_result]
    result = verify_read_only_connection(engine)
    assert result.verified
    sql = " ".join(str(call.args[0]) for call in connection.execute.call_args_list)
    assert "SELECT 1" in sql
    assert "transaction_read_only" in sql
    assert not any(word in sql.upper() for word in ("INSERT", "UPDATE", "DELETE"))
    transaction.rollback.assert_called_once()


def test_missing_config_cli_prints_safe_summary(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.delenv("DATA_SCIENCE_DATABASE_URL", raising=False)
    output = tmp_path / "pending.md"
    exit_code = main(["--output", str(output)])
    printed = capsys.readouterr().out
    payload = json.loads(printed)
    assert exit_code == 2
    assert payload["data_origin"] == "UNAVAILABLE"
    assert payload["evidence_state"] == "NO_REAL_DATA"
    assert "database_url" not in printed.lower()
    assert output.exists()


def test_configured_failure_never_falls_back_to_synthetic(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    config = DataScienceConfig(
        database_url="postgresql+psycopg://private:secret@invalid/db"
    )
    monkeypatch.setattr(
        "metaform_ds.real_evidence.verify_read_only_connection",
        MagicMock(side_effect=RuntimeError("private:secret@invalid")),
    )
    with pytest.raises(RealEvidenceExecutionError) as captured:
        run_real_evidence(config)
    assert "secret" not in str(captured.value)
    assert "synthetic" not in str(captured.value).lower()


def test_synthetic_cli_is_explicit_and_never_real(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.delenv("DATA_SCIENCE_DATABASE_URL", raising=False)
    output = tmp_path / "synthetic.md"
    exit_code = main(["--synthetic-validation", "--output", str(output)])
    payload = json.loads(capsys.readouterr().out)
    assert exit_code == 0
    assert payload["data_origin"] == "SYNTHETIC"
    assert not payload["integration_review_allowed"]
    assert "Data origin: SYNTHETIC" in output.read_text(encoding="utf-8")
