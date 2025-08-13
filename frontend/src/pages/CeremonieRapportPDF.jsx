// src/pages/CeremonieRapportPDF.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress,
} from '@mui/material';
import api from '../api/axiosInstance';

export default function CeremonieRapportPDF() {
  const [ceremonies, setCeremonies] = useState([]);
  const [selectedCeremony, setSelectedCeremony] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCeremonies();
  }, []);

  const fetchCeremonies = async () => {
    try {
      // Récupérer uniquement les cérémonies réalisées pour générer le rapport
      const res = await api.get('/ceremonies?status=REALISEE');
      setCeremonies(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement cérémonies' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedCeremony) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une cérémonie' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.get(`/ceremonies/${selectedCeremony}/rapport-pdf`, {
        responseType: 'blob', // important pour fichier binaire
      });

      // Création d'un lien pour télécharger le PDF
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_ceremonie_${selectedCeremony}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage({ type: 'success', text: 'Rapport PDF téléchargé avec succès.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement du rapport PDF.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = async () => {
    if (!selectedCeremony) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une cérémonie' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post(`/ceremonies/${selectedCeremony}/send-rapport-email`);
      setMessage({ type: 'success', text: 'Email avec le rapport envoyé aux participants.' });
    } catch (error) {
      setMessage({ type: 'error', text: "Erreur lors de l'envoi de l'email." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Génération du rapport PDF de la cérémonie
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="ceremony-label">Cérémonie réalisée</InputLabel>
          <Select
            labelId="ceremony-label"
            value={selectedCeremony}
            label="Cérémonie réalisée"
            onChange={(e) => setSelectedCeremony(e.target.value)}
          >
            {ceremonies.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.title} - {new Date(c.datetime).toLocaleDateString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDownloadPDF}
          disabled={loading || !selectedCeremony}
        >
          Télécharger le rapport PDF
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleSendMail}
          disabled={loading || !selectedCeremony}
        >
          Envoyer par email
        </Button>

        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>
    </Container>
  );
}
