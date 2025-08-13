from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from models import db

class ReunionStatus:
    PLANIFIEE = 'Planifiée'
    REALISEE = 'Réalisée'
    ANNULEE = 'Annulée'

class Reunion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    date_heure = db.Column(db.DateTime, nullable=False)
    lieu = db.Column(db.String(200))
    statut = db.Column(db.String(20), default=ReunionStatus.PLANIFIEE)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    participants = db.relationship(
        'ReunionParticipant',
        back_populates='reunion',
        cascade='all, delete-orphan'
    )
    certificats = db.relationship(
        'Certificate',
        back_populates='reunion',
        cascade='all, delete-orphan'
    )

class ReunionParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reunion_id = db.Column(db.Integer, db.ForeignKey('reunion.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    present = db.Column(db.Boolean, default=False)

    reunion = db.relationship('Reunion', back_populates='participants')
    user = db.relationship('User')

class Certificate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reunion_id = db.Column(db.Integer, db.ForeignKey('reunion.id'), nullable=False)
    contenu = db.Column(db.Text, nullable=False)
    date_emission = db.Column(db.DateTime, default=datetime.utcnow)
    fichier = db.Column(db.String(200))

    reunion = db.relationship('Reunion', back_populates='certificats')
    user = db.relationship('User')
