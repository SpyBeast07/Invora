# ==============================================================================
# Multi-Stage Build: Python 3.14 Builder Stage
# ==============================================================================
FROM python:3.14-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Multi-Stage Build: Python 3.14 Runner Stage (Secure Non-Root appuser)
# ==============================================================================
FROM python:3.14-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed system-wide dependencies from builder stage (guarantees appuser permission rights)
COPY --from=builder /usr/local /usr/local

COPY . .
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Secure environment by creating a non-privileged user and group to run the app
RUN groupadd -g 10001 appuser && \
    useradd -u 10000 -g appuser appuser && \
    chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
