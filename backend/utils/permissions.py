# utils/permissions.py

from flask_jwt_extended import get_jwt, verify_jwt_in_request
from functools import wraps
from flask import jsonify, request

# Fonctions utilitaires simples
def get_user_role():
    return get_jwt().get("role", "")

def is_admin():
    return get_user_role() == "ADMIN"

def is_agent_pki():
    return get_user_role() == "AGENT_PKI"

def is_participant():
    return get_user_role() == "PARTICIPANT"

def is_verificateur():
    return get_user_role() == "VERIFICATEUR"

# Décorateur pour autoriser uniquement les rôles donnés
# skip_on_options permet de bypasser la vérification pour les requêtes OPTIONS (préflight CORS)
def roles_required(*roles, skip_on_options=False):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if skip_on_options and request.method == 'OPTIONS':
                # Autorise la requête OPTIONS sans vérification de JWT
                return '', 200

            # Vérifie que le JWT est présent et valide
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"msg": "Token manquant ou invalide"}), 401

            user_role = get_user_role()
            if user_role not in roles:
                return jsonify({"msg": "Accès interdit pour ce rôle."}), 403

            return fn(*args, **kwargs)
        return decorated_view
    return wrapper
