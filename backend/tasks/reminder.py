from datetime import datetime, timedelta
from models import db
from reunion import Reunion, ReunionStatus
from utils.send_email import send_email

def envoyer_rappels():
    now = datetime.utcnow()
    demain = now + timedelta(days=1)
    
    reunions = Reunion.query.filter(
        Reunion.statut == ReunionStatus.PLANIFIEE,
        Reunion.date_heure.between(now, demain)
    ).all()

    for reunion in reunions:
        for participant in reunion.participants:
            user = participant.user
            role = user.role.value.upper()

            try:
                confirmation_html = ""
                # Ajouter un lien de confirmation uniquement pour les rôles concernés
                if role in ["PARTICIPANT", "AGENT_PKI"]:
                    confirmation_link = f"http://localhost:3000/presence?reunion_id={reunion.id}&user_id={user.id}"
                    confirmation_html = (
                        f"<p><a href='{confirmation_link}' "
                        f"style='display:inline-block;background-color:#4CAF50;color:white;"
                        f"padding:10px 20px;text-align:center;text-decoration:none;"
                        f"border-radius:5px;'>Confirmer ma présence</a></p>"
                    )

                send_email(
                    user.email,
                    "Rappel de cérémonie",
                    f"<p>Bonjour {user.full_name},</p>"
                    f"<p>Rappel : La cérémonie <strong>{reunion.titre}</strong> aura lieu demain à <strong>{reunion.date_heure.strftime('%Y-%m-%d %H:%M')}</strong>.</p>"
                    f"<p>Lieu : {reunion.lieu}</p>"
                    f"{confirmation_html}"
                )

                print(f"✅ Rappel envoyé à {user.email} pour la réunion {reunion.titre}")

            except Exception as e:
                print(f"❌ Erreur envoi email à {user.email} : {e}")

if __name__ == "__main__":
    envoyer_rappels()
