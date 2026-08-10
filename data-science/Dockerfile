# syntax=docker/dockerfile:1
FROM python:3.12-slim AS build
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /build

COPY pyproject.toml README.md ./
COPY src ./src
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install .

FROM python:3.12-slim AS runtime
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN addgroup --system metaform \
    && adduser --system --ingroup metaform --home /home/metaform metaform
COPY --from=build --chown=metaform:metaform /opt/venv /opt/venv

# The runtime is immutable and does not install packages. Remove pip from both
# the copied virtualenv and the base interpreter to avoid shipping its vendored
# build-only dependency inventory.
RUN rm -rf /opt/venv/lib/python3.12/site-packages/pip \
        /opt/venv/lib/python3.12/site-packages/pip-*.dist-info \
        /usr/local/lib/python3.12/site-packages/pip \
        /usr/local/lib/python3.12/site-packages/pip-*.dist-info \
    && rm -f /opt/venv/bin/pip* /usr/local/bin/pip*

USER metaform
WORKDIR /home/metaform
EXPOSE 8001
CMD ["uvicorn", "metaform_ds.serving.app:app", "--host", "0.0.0.0", "--port", "8001", "--no-access-log"]
