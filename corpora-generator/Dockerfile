FROM python:3.11-slim

LABEL maintainer="VitalsEdge Team <dev@vitalsedge.com>"
LABEL description="Medical corpora generator for VitalsEdge AI system"
LABEL version="1.0.0"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Google Cloud SDK
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | \
    tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
    apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    apt-get update && \
    apt-get install -y google-cloud-cli && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy generator scripts
COPY generate.sh /app/generate.sh
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create output directory
RUN mkdir -p /app/docs

# Set environment defaults
ENV OUTPUT_DIR=/app/docs
ENV GCS_BUCKET_NAME=medical-corpus
ENV NODE_ENV=production

# Make script executable
RUN chmod +x /app/generate.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD [ -f /app/docs/corpora.csv ] || exit 1

# Expose volume for data persistence
VOLUME [ "/app/docs" ]

# Default command - generate corpora on startup
CMD [ "/app/generate.sh" ]