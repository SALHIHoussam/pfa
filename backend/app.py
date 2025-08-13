from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_apscheduler import APScheduler
from models import db
from routes.auth import auth_bp, blacklist
from routes.reunion import reunion_bp
from tasks.reminder import envoyer_rappels
from tasks.auto_finalize import finaliser_reunions
from config import Config
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.url_map.strict_slashes = False
app.config.from_object(Config)

print("SendGrid API Key:", os.getenv('SENDGRID_API_KEY'))

# CORS pour autoriser le frontend React (localhost:3000) avec support des cookies (credentials)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Init DB et JWT
db.init_app(app)
jwt = JWTManager(app)

# Fonction pour vérifier si un token est blacklisté (révoqué)
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get('jti')
    is_revoked = jti in blacklist
    print(f"[JWT] Vérification blacklist jti={jti}: {is_revoked}")
    return is_revoked

# Gestion des erreurs JWT pour un debug facile
@jwt.unauthorized_loader
def unauthorized_callback(reason):
    print(f"[JWT ERROR] Unauthorized: {reason}")
    return jsonify({"msg": f"Unauthorized: {reason}"}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("[JWT ERROR] Token expired")
    return jsonify({"msg": "Token expired"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    print(f"[JWT ERROR] Invalid token: {reason}")
    return jsonify({"msg": f"Invalid token: {reason}"}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    print("[JWT ERROR] Token revoked (blacklist)")
    return jsonify({"msg": "Token revoked"}), 401

# Enregistre les Blueprints (authentification, réunion)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(reunion_bp, url_prefix='/api/reunion')

# Scheduler Flask APScheduler pour tâches planifiées
scheduler = APScheduler()

# Tâche : rappel quotidien à 9h
@scheduler.task('cron', id='daily_reminder', hour=9)
def rappel_quotidien():
    with app.app_context():
        print("[Scheduler] Exécution du rappel quotidien")
        envoyer_rappels()

# Tâche : finalisation automatique des cérémonies à 1minutes
@scheduler.task('interval', id='auto_finalize', minutes=1)
def tache_auto_finalize():
    with app.app_context():
        print("[Scheduler] Vérification automatique chaque minute des cérémonies à finaliser")
        finaliser_reunions()

scheduler.init_app(app)
scheduler.start()

# Crée les tables si elles n'existent pas
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # debug=True uniquement en dev
    app.run(host="0.0.0.0", port=5000, debug=True)
