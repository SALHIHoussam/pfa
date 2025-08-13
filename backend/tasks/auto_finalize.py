from datetime import datetime
import pytz
from models import db
from reunion import Reunion, ReunionStatus, Certificate
from utils.send_email import send_email_with_attachment
from utils.pdf_generator import generate_pdf_report, generate_certificate_pdf
from utils.crypto_utils import generate_rsa_keypair
import os

def finaliser_reunion_unique(reunion):
    print(f"[MANUEL/AUTO] Finalisation de la cérémonie: {reunion.titre}")
    reunion.statut = ReunionStatus.REALISEE

    cert_dir = f"certificats/{reunion.id}/"
    os.makedirs(cert_dir, exist_ok=True)

    participants_present = []
    agents_pki_present = []
    tous_les_presents = []

    for p in reunion.participants:
        user = p.user
        if not p.present:
            continue

        tous_les_presents.append(user)

        if user.role == "PARTICIPANT":
            participants_present.append(user)
        elif user.role == "AGENT_PKI":
            agents_pki_present.append(user)
        elif user.role == "VERIFICATEUR":
            continue  # Pas de certificat pour vérificateur

        user_cert_dir = os.path.join(cert_dir, str(user.id))
        os.makedirs(user_cert_dir, exist_ok=True)

        private_key_pem, _ = generate_rsa_keypair()
        cert_path, sig_path = generate_certificate_pdf(
            user,
            reunion,
            os.path.join(user_cert_dir, f"certificat_{reunion.id}_{user.id}.pdf"),
            private_key_pem=private_key_pem
        )

        certificat = Certificate(
            user_id=user.id,
            reunion_id=reunion.id,
            contenu="Certificat PDF généré automatiquement",
            fichier=cert_path
        )
        db.session.add(certificat)

        try:
            send_email_with_attachment(
                to_email=user.email,
                subject=f"Certificat de la cérémonie '{reunion.titre}'",
                html_content=f"""
                    <p>Bonjour {user.full_name},</p>
                    <p>Merci pour votre présence lors de la cérémonie <b>{reunion.titre}</b>.</p>
                    <p>Veuillez trouver en pièce jointe votre certificat.</p>
                """,
                attachment_path=cert_path
            )
            print(f"Certificat envoyé à {user.email}")
        except Exception as e:
            print(f"Erreur envoi certificat à {user.email} : {e}")

    os.makedirs("reports", exist_ok=True)
    rapport_path = generate_pdf_report(
        reunion,
        participants_present,
        agents_pki_present,
        "Agent PKI",
        sign_pdf=False
    )

    for user in tous_les_presents:
        try:
            send_email_with_attachment(
                to_email=user.email,
                subject=f"Rapport de la cérémonie '{reunion.titre}'",
                html_content=f"""
                    <p>Bonjour {user.full_name},</p>
                    <p>Le rapport de la cérémonie <b>{reunion.titre}</b> est disponible en pièce jointe.</p>
                """,
                attachment_path=rapport_path
            )
            print(f"Rapport envoyé à {user.email}")
        except Exception as e:
            print(f"Erreur envoi rapport à {user.email} : {e}")

def finaliser_reunions():
    tz_tunis = pytz.timezone('Africa/Tunis')
    now = datetime.now(tz_tunis)  # heure locale Tunis aware
    print(f"[Scheduler] Heure actuelle Tunis : {now.isoformat()}")

    reunions = Reunion.query.all()
    reunions_a_finaliser = []

    for reunion in reunions:
        dt = reunion.date_heure
        # Si date naive, la considérer en heure locale Tunis
        if dt.tzinfo is None:
            dt = tz_tunis.localize(dt)
        if reunion.statut == ReunionStatus.PLANIFIEE and dt <= now:
            reunions_a_finaliser.append(reunion)

    print(f"[Scheduler] Réunions à finaliser trouvées : {[r.id for r in reunions_a_finaliser]}")

    for reunion in reunions_a_finaliser:
        print(f"[Scheduler] Finalisation de la réunion id={reunion.id} titre='{reunion.titre}'")
        try:
            finaliser_reunion_unique(reunion)
        except Exception as e:
            print(f"[Erreur] lors de la finalisation réunion {reunion.id} : {e}")

    try:
        db.session.commit()
        print("[Scheduler] Commit effectué avec succès")
    except Exception as e:
        print(f"[Erreur] lors du commit : {e}")
        db.session.rollback()

if __name__ == "__main__":
    finaliser_reunions()
