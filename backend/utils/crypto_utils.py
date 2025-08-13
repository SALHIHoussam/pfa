from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.serialization import BestAvailableEncryption
import os

def generate_rsa_keypair(password: bytes = None):
    """
    Génère une paire de clés RSA privée/publique.
    password : bytes pour protéger la clé privée (optionnel)
    Retourne (private_key_pem, public_key_pem) en bytes.
    """
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    encryption_algo = serialization.NoEncryption()
    if password:
        encryption_algo = BestAvailableEncryption(password)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=encryption_algo
    )
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return private_pem, public_pem

def sign_data(private_key_pem: bytes, data: bytes, password: bytes = None) -> bytes:
    """
    Signe les données avec la clé privée.
    """
    private_key = serialization.load_pem_private_key(private_key_pem, password=password)
    signature = private_key.sign(
        data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256()
    )
    return signature

def save_key(path: str, key_bytes: bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(key_bytes)
