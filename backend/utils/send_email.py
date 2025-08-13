import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

def send_email(to_email, subject, html_content):
    message = Mail(
        from_email=os.getenv('SENDGRID_SENDER'),
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        sg.send(message)
        print(f"[INFO] Email envoyé à {to_email}")
    except Exception as e:
        print(f"[ERROR] Erreur envoi email : {e}")

def send_email_with_attachment(to_email, subject, html_content, attachment_path):
    with open(attachment_path, 'rb') as f:
        data = f.read()
    encoded_file = base64.b64encode(data).decode()

    attachedFile = Attachment(
        FileContent(encoded_file),
        FileName(os.path.basename(attachment_path)),
        FileType('application/pdf'),
        Disposition('attachment')
    )

    message = Mail(
        from_email=os.getenv('SENDGRID_SENDER'),
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    message.attachment = attachedFile

    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        sg.send(message)
        print(f"[INFO] Email avec pièce jointe envoyé à {to_email}")
    except Exception as e:
        print(f"[ERROR] Erreur envoi email avec pièce jointe : {e}")

