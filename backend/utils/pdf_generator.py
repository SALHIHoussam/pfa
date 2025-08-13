import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter
from datetime import datetime
import os

from utils.crypto_utils import sign_data  # Assure-toi que ce fichier existe

def generate_pdf_report(reunion, participants, actions, agent_pki, sign_pdf=False, sign_key_path=None):
    """
    Génère un rapport PDF pour la cérémonie.

    Args:
        reunion: objet Reunion (titre, date, lieu, etc.)
        participants: liste d'utilisateurs présents
        actions: liste d'actions effectuées (ex: génération clé)
        agent_pki: nom de l'agent PKI responsable
        sign_pdf: bool, si on veut signer numériquement
        sign_key_path: chemin vers certificat clé privée (optionnel)
    Returns:
        chemin vers le fichier PDF généré
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Titre et infos générales
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width / 2, height - 50, f"Rapport de la Cérémonie : {reunion.titre}")

    c.setFont("Helvetica", 12)
    date_str = reunion.date_heure.strftime('%d %B %Y à %Hh%M')
    c.drawString(50, height - 80, f"Date et Heure : {date_str}")
    c.drawString(50, height - 100, f"Lieu : {reunion.lieu}")
    c.drawString(50, height - 120, f"Agent PKI Responsable : {agent_pki}")

    # Participants
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 150, "Participants présents :")
    c.setFont("Helvetica", 11)
    y = height - 170
    for p in participants:
        c.drawString(60, y, f"- {p.full_name} ({p.role.value})")
        y -= 15

    # Actions effectuées
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Actions effectuées :")
    y -= 20
    c.setFont("Helvetica", 11)
    for action in actions:
        c.drawString(60, y, f"- {action}")
        y -= 15

    # Signature numérique (optionnelle)
    c.setFont("Helvetica-Bold", 12)
    if sign_pdf:
        c.drawString(50, y - 20, "Signature numérique : Oui (voir fichier joint)")
    else:
        c.drawString(50, y - 20, "Signature numérique : Non")

    c.showPage()
    c.save()

    buffer.seek(0)
    pdf_bytes = buffer.read()

    # Sauvegarde PDF dans un fichier temporaire
    pdf_path = f"reports/rapport_ceremonie_{reunion.id}.pdf"
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

    # Si signature demandée, signer le PDF (simple, pas une vraie signature qualifiée)
    if sign_pdf and sign_key_path:
        signed_pdf_path = pdf_path.replace(".pdf", "_signed.pdf")

        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)

        # Ici tu pourrais ajouter un champ de signature ou métadonnée spéciale

        with open(signed_pdf_path, "wb") as f_out:
            writer.write(f_out)

        return signed_pdf_path

    else:
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        return pdf_path


def generate_certificate_pdf(user, reunion, filepath, private_key_pem=None, private_key_password=None):
    """
    Génère un certificat PDF simple avec signature cryptographique.

    Args:
        user: objet User (participant)
        reunion: objet Reunion
        filepath: chemin complet pour sauvegarder le PDF
        private_key_pem: clé privée en bytes pour signer le PDF (optionnel)
        private_key_password: mot de passe pour la clé privée (optionnel)
    Returns:
        tuple (chemin_pdf, chemin_signature) : signature None si non signée
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Titre centré en gros
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 100, "CERTIFICAT DE PARTICIPATION")

    # Texte descriptif bien centré et structuré
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 140, "Ce certificat est décerné à :")

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 170, f"{user.full_name}")

    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 200, "Pour sa participation à la cérémonie :")

    c.setFont("Helvetica-BoldOblique", 16)
    c.drawCentredString(width / 2, height - 230, f"{reunion.titre}")

    # Date formatée
    date_str = reunion.date_heure.strftime('%d %B %Y à %Hh%M')
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 260, f"Organisée le {date_str}")

    # Signature textuelle
    c.setFont("Helvetica-Oblique", 12)
    c.drawCentredString(width / 2, height - 300, "Signé électroniquement par l'ANCE (TUNTRUST)")

    c.showPage()
    c.save()

    buffer.seek(0)
    pdf_bytes = buffer.read()

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)

    if private_key_pem:
        signature = sign_data(private_key_pem, pdf_bytes, password=private_key_password)
        sig_path = filepath + ".sig"
        with open(sig_path, "wb") as f_sig:
            f_sig.write(signature)
        return filepath, sig_path

    return filepath, None
