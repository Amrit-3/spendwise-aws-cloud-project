FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements first so Docker caches the pip install layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as a non-root user (same idea as the "spendwise" user on EC2)
RUN useradd --system --no-create-home --shell /usr/sbin/nologin spendwise
USER spendwise

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
