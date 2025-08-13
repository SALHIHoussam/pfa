from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import enum

db = SQLAlchemy()

class UserRole(enum.Enum):
    ADMIN = 'ADMIN'
    AGENT_PKI = 'AGENT_PKI'
    PARTICIPANT = 'PARTICIPANT'
    VERIFICATEUR = 'VERIFICATEUR'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.Enum(UserRole), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Champs spécifiques
    phone = db.Column(db.String(20))
    position = db.Column(db.String(100))
    department = db.Column(db.String(100))
    invite_code = db.Column(db.String(50))  # Pour admin
    badge_number = db.Column(db.String(50))
    unit = db.Column(db.String(100))
    experience_years = db.Column(db.Integer)
    organization = db.Column(db.String(100))
    ceremony_role = db.Column(db.String(50))
    id_type = db.Column(db.String(20))
    id_number = db.Column(db.String(50))
    verification_type = db.Column(db.String(100))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
