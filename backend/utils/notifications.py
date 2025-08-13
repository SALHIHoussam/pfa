# utils/notifications.py

from utils.send_email import send_email
from flask import url_for

def notify_invitation(reunion, user):
    link = f"http://localhost:3000/presence-confirm?reunion_id={reunion.id}&user_id={user.id}"
    send_email(
        user.email,
        "Invitation à une cérémonie",
        f"""
        <p>Vous êtes invité à la cérémonie '{reunion.titre}' le {reunion.date_heure.strftime('%Y-%m-%d %H:%M')} à {reunion.lieu}.</p>
        <p><a href="{link}">Cliquez ici pour confirmer votre présence</a></p>
        """
    )

def notify_annulation(reunion, user):
    send_email(
        user.email,
        "Cérémonie annulée",
        f"La cérémonie '{reunion.titre}' prévue le {reunion.date_heure.strftime('%Y-%m-%d %H:%M')} a été annulée."
    )

def notify_modification(reunion, user):
    send_email(
        user.email,
        f"Mise à jour de la cérémonie '{reunion.titre}'",
        f"""
        <p>Bonjour {user.full_name},</p>
        <p>La cérémonie '{reunion.titre}' a été modifiée. Merci de vérifier les nouvelles informations.</p>
        """
    )
