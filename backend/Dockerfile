# ── Stage 1: Builder (installs deps with compiler) ──────────
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build tools (only needed to compile packages like grpcio/cryptography)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        pkg-config \
        libpq-dev \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a venv so we can copy just that
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt \
    && pip install --no-cache-dir --prefix=/install gunicorn


# ── Stage 2: Runtime (tiny final image, no compiler) ────────
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Only the runtime library needed (libpq for psycopg2)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled packages from builder
COPY --from=builder /install /usr/local

# Copy project code
COPY . /app/

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
