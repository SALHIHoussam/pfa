import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../api/axiosInstance';

export default function ParticipantCertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await api.get('/certificats/mes-certificats');
        setCerts(res.data);
      } catch (err) {
        console.error('Erreur chargement certificats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  return (
    <>
      <Navbar role="PARTICIPANT" />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Mes Certificats</Typography>
        {loading ? (
          <Typography>Chargement...</Typography>
        ) : certs.length === 0 ? (
          <Typography>Aucun certificat trouvé.</Typography>
        ) : (
          <List>
            {certs.map(cert => (
              <ListItem key={cert.id} divider>
                <ListItemText
                  primary={`Certificat pour la cérémonie : ${cert.reunionTitle}`}
                  secondary={`Émis le : ${new Date(cert.issuedAt).toLocaleDateString()}`}
                />
                <Button
                  variant="outlined"
                  href={cert.downloadUrl}
                  target="_blank"
                >
                  Télécharger
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Container>
      <Footer />
    </>
  );
}
