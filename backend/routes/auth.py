from flask import Blueprint, request, jsonify, redirect
from models import db, User, UserRole
from reunion import ReunionParticipant, Reunion

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask_jwt_extended import (
    create_access_token, decode_token,
    jwt_required, get_jwt
)
from datetime import timedelta
import os

auth_bp = Blueprint('auth', __name__)

# Blacklist utilisée pour invalider les tokens à la déconnexion
blacklist = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    role_raw = data.get('role')
    if not role_raw:
        return jsonify({'error': 'Rôle requis'}), 400

    role = role_raw.upper()
    if role not in UserRole.__members__:
        return jsonify({'error': 'Rôle invalide'}), 400

    email = data.get('email')
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email déjà utilisé'}), 400

    user = User(
        role=UserRole[role],
        full_name=data.get('full_name'),
        email=email
    )
    user.set_password(data.get('password'))

    # Champs spécifiques par rôle
    if role == 'ADMIN':
        required_fields = ['phone', 'position', 'department', 'invite_code']
        for f in required_fields:
            if not data.get(f):
                return jsonify({'error': f'{f} requis'}), 400
        if data['invite_code'] != "ACME-ADMIN-SECRET":
            return jsonify({'error': 'Code d’invitation incorrect'}), 403
        user.phone = data['phone']
        user.position = data['position']
        user.department = data['department']
        user.invite_code = data['invite_code']
        user.is_active = True

    elif role == 'AGENT_PKI':
        required_fields = ['badge_number', 'unit', 'experience_years']
        for f in required_fields:
            if not data.get(f):
                return jsonify({'error': f'{f} requis'}), 400
        user.badge_number = data['badge_number']
        user.unit = data['unit']
        user.experience_years = data['experience_years']

    elif role == 'PARTICIPANT':
        required_fields = ['organization', 'ceremony_role', 'id_type', 'id_number', 'mobile']
        for f in required_fields:
            if not data.get(f):
                return jsonify({'error': f'{f} requis'}), 400
        user.organization = data['organization']
        user.ceremony_role = data['ceremony_role']
        user.id_type = data['id_type']
        user.id_number = data['id_number']
        user.phone = data['mobile']

    elif role == 'VERIFICATEUR':
        required_fields = ['organization', 'verification_type']
        for f in required_fields:
            if not data.get(f):
                return jsonify({'error': f'{f} requis'}), 400
        user.organization = data['organization']
        user.verification_type = data['verification_type']

    if role != 'ADMIN':
        user.is_active = False

    db.session.add(user)
    db.session.commit()

    if role != 'ADMIN':
        try:
            token = create_access_token(identity=user.email, expires_delta=timedelta(hours=24))
            activation_link = f"http://localhost:5000/api/auth/activate/{token}"

            html_content = f"""
            <p>Bonjour {user.full_name},</p>
            <p>Merci pour votre inscription en tant que <b>{user.role.value}</b>.</p>
            <p>Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
            <p>
              <a href="{activation_link}" style="
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: white;
                background-color: #007bff;
                text-decoration: none;
                border-radius: 5px;
              ">Activer mon compte</a>
            </p>
            <p><small>Ce lien expirera dans 24 heures.</small></p>
            """

            message = Mail(
                from_email='houssamsalhi2022@gmail.com',
                to_emails=user.email,
                subject='Activation de votre compte',
                html_content=html_content
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            sg.send(message)

        except Exception as e:
            print(f"[ERROR] Envoi email échoué : {e}")
    else:
        print("[INFO] Admin activé sans email.")

    return jsonify({'message': 'Utilisateur enregistré avec succès'}), 201


@auth_bp.route('/activate/<token>', methods=['GET'])
def activate_account(token):
    try:
        decoded = decode_token(token)
        email = decoded['sub']
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'Utilisateur introuvable'}), 404

        if user.is_active:
            return redirect("http://localhost:3000/activation-already")

        user.is_active = True
        db.session.commit()

        return redirect("http://localhost:3000/activation-success")

    except Exception as e:
        print(f"[ERROR] Erreur activation : {e}")
        return redirect("http://localhost:3000/activation-expired")

@auth_bp.route('/delete_all_users', methods=['DELETE'])
def delete_all_users():
    try:
        num_deleted = db.session.query(User).delete()
        db.session.commit()
        return jsonify({'message': f'{num_deleted} utilisateurs supprimés avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la suppression : {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    if not user.check_password(password):
        return jsonify({'error': 'Mot de passe incorrect'}), 401

    if not user.is_active:
        return jsonify({'error': 'Compte non activé. Vérifiez votre email.'}), 403

    access_token = create_access_token(
        identity=user.email,  # ✅ doit être une string
        additional_claims={"role": user.role.value}
    )

    return jsonify({
        'message': 'Connexion réussie',
        'access_token': access_token,
        'user': {
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role.value
        }
    }), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    # Optionnel : vérifie que l'utilisateur est ADMIN
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'full_name': u.full_name,
        'email': u.email,
        'role': u.role.name,
        'is_active': u.is_active
    } for u in users]), 200


@auth_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    if new_role not in UserRole.__members__:
        return jsonify({'error': 'Rôle invalide'}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    user.role = UserRole[new_role]
    db.session.commit()
    return jsonify({'message': 'Rôle mis à jour'}), 200


@auth_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    user.is_active = data.get('is_active', user.is_active)
    db.session.commit()
    return jsonify({'message': 'État mis à jour'}), 200


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Trouver toutes les réunions où l'utilisateur est participant
    participations = ReunionParticipant.query.filter_by(user_id=user.id).all()
    reunion_ids = set(p.reunion_id for p in participations)

    # Supprimer toutes ces réunions (et leurs relations en cascade)
    for reunion_id in reunion_ids:
        reunion = Reunion.query.get(reunion_id)
        if reunion:
            db.session.delete(reunion)

    # Supprimer l'utilisateur
    db.session.delete(user)

    db.session.commit()

    return jsonify({'message': 'Utilisateur et ses cérémonies supprimés'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    token = create_access_token(identity=user.email, expires_delta=timedelta(hours=1))
    reset_link = f"http://localhost:3000/reset-password/{token}"

    html_content = f"""
        <p>Bonjour {user.full_name},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>
          <a href="{reset_link}">Cliquez ici pour réinitialiser</a>
        </p>
        <p>Ce lien expirera dans 1 heure.</p>
    """

    try:
        message = Mail(
            from_email=os.environ.get('SENDGRID_SENDER'),
            to_emails=user.email,
            subject="Réinitialisation de mot de passe",
            html_content=html_content
        )
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        sg.send(message)
    except Exception as e:
        print(f"[ERROR] Échec envoi email reset: {e}")
        return jsonify({'error': "Erreur d'envoi de l'email"}), 500

    return jsonify({'message': "Email de réinitialisation envoyé"}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({'error': 'Token et nouveau mot de passe requis'}), 400

    try:
        decoded = decode_token(token)
        email = decoded['sub']
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({'error': 'Utilisateur introuvable'}), 404

        user.set_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Mot de passe mis à jour avec succès'}), 200

    except Exception as e:
        print(f"[ERROR] Reset error : {e}")
        return jsonify({'error': 'Token invalide ou expiré'}), 400


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    blacklist.add(jti)
    return jsonify({"message": "Déconnexion réussie"}), 200
