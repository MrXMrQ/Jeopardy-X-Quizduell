# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 1. Zuerst NUR die requirements.txt kopieren
COPY requirements.txt .

# 2. Die Bibliotheken im Container installieren
RUN pip install --no-cache-dir -r requirements.txt

# 3. Dann den restlichen Code kopieren
COPY . .

# 4. Den Server starten
CMD ["python3", "server.py"]