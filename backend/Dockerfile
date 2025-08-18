FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système requises
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn  # Ajoutez explicitement gunicorn ici

COPY . .

EXPOSE 5000

# Correction de la commande CMD (supprimez les crochets)
CMD gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
