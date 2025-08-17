# Image Python
FROM python:3.11-slim

# Créer un dossier app
WORKDIR /app

# Copier les dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

# Exposer le port Flask
EXPOSE 5000

# Commande de lancement
CMD ["python", "app.py"]
