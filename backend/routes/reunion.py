from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, UserRole
from reunion import Reunion, ReunionParticipant, ReunionStatus, Certificate
from utils.send_email import send_email, send_email_with_attachment
from utils.pdf_generator import generate_pdf_report, generate_certificate_pdf
from utils.crypto_utils import generate_rsa_keypair, save_key
from utils.permissions import roles_required
from datetime import datetime
from datetime import timezone
import os
from tasks.auto_finalize import finaliser_reunion_unique  # Import pour finalisation manuelle
from utils.notifications import notify_annulation, notify_invitation, notify_modification

reunion_bp = Blueprint('reunion', __name__)

@reunion_bp.route('/planifier', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
@roles_required("ADMIN", "AGENT_PKI", skip_on_options=True)
def planifier():
    if request.method == 'OPTIONS':
        return '', 200

    if not request.is_json:
        return jsonify({"error": "Le corps de la requête doit être en JSON"}), 400

    data = request.get_json()
    required_fields = ['titre', 'date_heure', 'lieu', 'participants']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ '{field}' est requis"}), 400

    titre = data['titre']
    description = data.get('description')
    try:
        date_heure = datetime.strptime(data['date_heure'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    except ValueError:
        return jsonify({"error": "Format de date_heure invalide, attendu YYYY-MM-DDTHH:MM"}), 400


    lieu = data['lieu']
    participant_ids = data['participants']

    reunion = Reunion(
        titre=titre,
        description=description,
        date_heure=date_heure,
        lieu=lieu,
        statut=ReunionStatus.PLANIFIEE
    )
    db.session.add(reunion)

    db.session.flush()  # Pour récupérer l'id de reunion avant commit

    for user_id in participant_ids:
        participant = ReunionParticipant(user_id=user_id, reunion=reunion)
        db.session.add(participant)
        user = User.query.get(user_id)
        if user:
            link = f"http://localhost:3000/presence-confirm?reunion_id={reunion.id}&user_id={user.id}"
            send_email(
                user.email,
                "Invitation à une cérémonie",
                f"""
                <p>Vous êtes invité à la cérémonie '{titre}' le {date_heure}.</p>
                <p><a href="{link}">Cliquez ici pour confirmer votre présence</a></p>
                """
            )

    db.session.commit()
    return jsonify({'message': 'Cérémonie planifiée avec succès.'})


@reunion_bp.route('/<int:id>/presence', methods=['PATCH'])
@jwt_required()
@roles_required("PARTICIPANT")
def valider_presence(id):
    user_id = get_jwt_identity()
    reunion = Reunion.query.get_or_404(id)

    participant = ReunionParticipant.query.filter_by(
        reunion_id=reunion.id,
        user_id=user_id
    ).first()

    if not participant:
        return jsonify({"error": "Vous n'êtes pas inscrit à cette cérémonie."}), 403

    if participant.present:
        return jsonify({"message": "Votre présence a déjà été enregistrée."}), 200

    participant.present = True
    db.session.commit()

    return jsonify({"message": "Présence enregistrée avec succès."})


@reunion_bp.route('/<int:id>/presence_link', methods=['GET'])
def presence_par_lien(id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Paramètre user_id manquant"}), 400

    participant = ReunionParticipant.query.filter_by(
        reunion_id=id,
        user_id=user_id
    ).first()

    if not participant:
        return jsonify({"error": "Utilisateur non inscrit à cette cérémonie."}), 403

    if participant.present:
        return jsonify({"message": "Présence déjà enregistrée."}), 200

    participant.present = True
    db.session.commit()

    return jsonify({"message": f"Présence enregistrée avec succès pour {participant.user.full_name}."})


@reunion_bp.route('/<int:id>/finaliser', methods=['POST'])
@jwt_required()
@roles_required("ADMIN", "AGENT_PKI")
def finaliser_manuellement(id):
    reunion = Reunion.query.get_or_404(id)

    if reunion.statut == ReunionStatus.REALISEE:
        return jsonify({"message": "La cérémonie est déjà finalisée."}), 200

    try:
        finaliser_reunion_unique(reunion)
        db.session.commit()
        return jsonify({"message": "Cérémonie finalisée avec succès."})
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la finalisation : {str(e)}"}), 500


@reunion_bp.route('/<int:id>', methods=['PUT', 'OPTIONS'])
@jwt_required(optional=True)
@roles_required("ADMIN", "AGENT_PKI", skip_on_options=True)
def modifier_reunion(id):
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    reunion = Reunion.query.get_or_404(id)

    if reunion.statut != ReunionStatus.PLANIFIEE:
        return jsonify({'error': 'Modification impossible, la cérémonie n\'est plus planifiée.'}), 403

    if data.get('statut'):
        new_statut = data['statut']
        if new_statut not in ['ANNULEE', 'REALISEE']:
            return jsonify({'error': 'Statut invalide'}), 400
        
        reunion.statut = getattr(ReunionStatus, new_statut)  # Corrigé pour éviter l'erreur 'not subscriptable'

        if reunion.statut == ReunionStatus.ANNULEE:
            for p in reunion.participants:
                notify_annulation(reunion, p.user)

        elif reunion.statut == ReunionStatus.REALISEE:
            # Génération certificats & sauvegarde clés
            for p in reunion.participants:
                if not p.present:
                    continue
                if p.user.role not in [UserRole.PARTICIPANT, UserRole.AGENT_PKI]:
                    continue

                cert_dir = f"certificats/{reunion.id}/{p.user.id}"
                os.makedirs(cert_dir, exist_ok=True)

                private_key_pem, public_key_pem = generate_rsa_keypair(password=None)
                save_key(os.path.join(cert_dir, "private_key.pem"), private_key_pem)
                save_key(os.path.join(cert_dir, "public_key.pem"), public_key_pem)

                cert_path, sig_path = generate_certificate_pdf(
                    p.user,
                    reunion,
                    os.path.join(cert_dir, f"certificat_{reunion.id}_{p.user.id}.pdf"),
                    private_key_pem=private_key_pem
                )

                certificat = Certificate(
                    user_id=p.user.id,
                    reunion_id=reunion.id,
                    contenu="Certificat PDF généré et signé",
                    fichier=cert_path
                )
                db.session.add(certificat)

    else:
        reunion.titre = data.get('titre', reunion.titre)
        reunion.description = data.get('description', reunion.description)
        if data.get('date_heure'):
            try:
                reunion.date_heure = datetime.strptime(data['date_heure'], '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify({"error": "Format de date_heure invalide, attendu YYYY-MM-DDTHH:MM"}), 400
        reunion.lieu = data.get('lieu', reunion.lieu)

        if 'participants' in data:
            ReunionParticipant.query.filter_by(reunion_id=reunion.id).delete()
            for user_id in data['participants']:
                participant = ReunionParticipant(user_id=user_id, reunion=reunion)
                db.session.add(participant)

    db.session.commit()
    return jsonify({'message': 'Cérémonie mise à jour avec succès.'})


@reunion_bp.route('/<int:id>/rapport', methods=['GET'])
@jwt_required()
@roles_required("ADMIN", "AGENT_PKI", "PARTICIPANT")
def rapport(id):
    reunion = Reunion.query.get_or_404(id)
    participants = [p.user for p in reunion.participants]
    actions = []
    agent_pki = "Agent PKI"
    output_path = f"reports/rapport_ceremonie_{id}.pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    generate_pdf_report(reunion, participants, actions, agent_pki, sign_pdf=False)

    for p in reunion.participants:
        send_email_with_attachment(
            to_email=p.user.email,
            subject=f"Rapport de la cérémonie '{reunion.titre}'",
            html_content=f"<p>Bonjour {p.user.full_name}, veuillez trouver le rapport de la cérémonie '{reunion.titre}' en pièce jointe.</p>",
            attachment_path=output_path
        )

    return send_file(output_path, as_attachment=True)


@reunion_bp.route('/<int:id>/certificats', methods=['GET'])
@jwt_required()
@roles_required("ADMIN", "AGENT_PKI", "PARTICIPANT")
def liste_certificats(id):
    reunion = Reunion.query.get_or_404(id)
    certificats = Certificate.query.filter_by(reunion_id=id).all()
    return jsonify([
        {
            'user': c.user.full_name,
            'fichier': c.fichier,
            'date_emission': c.date_emission.isoformat() if c.date_emission else None
        } for c in certificats
    ])


@reunion_bp.route('/', methods=['GET'])
@jwt_required()
@roles_required("ADMIN", "AGENT_PKI", "PARTICIPANT","VERIFICATEUR")
def liste_reunions():
    identity = get_jwt_identity()

    statut = request.args.get('statut', None)
    role = request.args.get('role', None)
    user_id = request.args.get('user_id', None)

    query = Reunion.query

    if statut:
        query = query.filter(Reunion.statut == statut)

    if user_id:
        query = query.join(ReunionParticipant).filter(ReunionParticipant.user_id == int(user_id))

    if role:
        query = query.join(ReunionParticipant).join(User).filter(User.role == role)

    reunions = query.order_by(Reunion.date_heure.desc()).all()

    return jsonify([
        {
            'id': r.id,
            'titre': r.titre,
            'statut': r.statut.value if hasattr(r.statut, 'value') else r.statut,
            'date_heure': r.date_heure.isoformat(),
            'lieu': r.lieu
        } for r in reunions
    ])



@reunion_bp.route('/<int:id>/details', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
@roles_required("ADMIN", "AGENT_PKI", "PARTICIPANT", skip_on_options=True)
def details_reunion(id):
    if request.method == 'OPTIONS':
        return '', 200

    reunion = Reunion.query.get_or_404(id)

    participants = [
        {
            'id': p.user.id,
            'full_name': p.user.full_name,
            'email': p.user.email,
            'role': p.user.role.name if hasattr(p.user.role, 'name') else p.user.role,
            'present': p.present
        }
        for p in reunion.participants
    ]

    certificats = [
        {
            'id': c.id,
            'user_id': c.user_id,
            'user_full_name': c.user.full_name,
            'fichier': c.fichier,
            'date_emission': c.date_emission.isoformat() if c.date_emission else None
        }
        for c in reunion.certificats
    ]

    details = {
        'id': reunion.id,
        'titre': reunion.titre,
        'description': reunion.description,
        'date_heure': reunion.date_heure.isoformat(),
        'lieu': reunion.lieu,
        'statut': reunion.statut,
        'participants': participants,
        'certificats': certificats
    }

    return jsonify(details)
