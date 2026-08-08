from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from metaform_ds.config import DataScienceConfig
from metaform_ds.strength_evidence import (
    StrengthEvidenceExecutionError,
    main,
    run_real_strength_evidence,
)


def test_missing_config_cli_is_safe(
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


def test_configured_failure_never_falls_back_or_prints_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    config = DataScienceConfig(
        database_url="postgresql+psycopg://private:secret@invalid/db"
    )
    monkeypatch.setattr(
        "metaform_ds.strength_evidence.verify_read_only_connection",
        MagicMock(side_effect=RuntimeError("private:secret@invalid")),
    )
    with pytest.raises(StrengthEvidenceExecutionError) as captured:
        run_real_strength_evidence(config)
    assert "secret" not in str(captured.value)
    assert "synthetic" not in str(captured.value).lower()


def test_synthetic_cli_is_explicit_and_aggregate(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.delenv("DATA_SCIENCE_DATABASE_URL", raising=False)
    output = tmp_path / "synthetic.md"
    exit_code = main(["--synthetic-validation", "--output", str(output)])
    printed = capsys.readouterr().out
    payload = json.loads(printed)
    assert exit_code == 0
    assert payload["data_origin"] == "SYNTHETIC"
    assert not payload["integration_review_allowed"]
    assert "synthetic_user" not in printed
    assert "Data origin: SYNTHETIC" in output.read_text(encoding="utf-8")
