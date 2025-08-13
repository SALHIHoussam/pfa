import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress,
} from '@mui/material';
import api from '../api/axiosInstance';

export default function GenerateCertificatePage() {
  const [ceremonies, setCeremonies] = useState([]);
  const [selectedCeremony, setSelectedCeremony] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCeremonies();
  }, []);

  useEffect(() => {
    if (selectedCeremony) {
      fetchParticipants(selectedCeremony);
      fetchCertificates(selectedCeremony);
    } else {
      setParticipants([]);
      setSelectedParticipant('');
      setCertificates([]);
    }
  }, [selectedCeremony]);

  const fetchCeremonies = async () => {
    try {
      const res = await api.get('/ceremonies?status=REALISEE'); // On veut les cérémonies réalisées
      setCeremonies(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement cérémonies' });
    }
  };

  const fetchParticipants = async (ceremonyId) => {
    try {
      const res = await api.get(`/ceremonies/${ceremonyId}/participants`);
      setParticipants(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement participants' });
    }
  };

  const fetchCertificates = async (ceremonyId) => {
    try {
      const res = await api.get(`/ceremonies/${ceremonyId}/certificates`);
      setCertificates(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement certificats' });
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedCeremony || !selectedParticipant) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une cérémonie et un participant' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // API backend qui génère la paire de clés, signe le certificat et sauvegarde
      const res = await api.post(`/ceremonies/${selectedCeremony}/certificates`, {
        participantId: selectedParticipant,
      });

      setCertificates((prev) => [...prev, res.data]);
      setMessage({ type: 'success', text: 'Certificat généré avec succès.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la génération du certificat.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Génération de certificats
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <FormControl sx={{ minWidth: 250 }}>
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

        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel id="participant-label">Participant</InputLabel>
          <Select
            labelId="participant-label"
            value={selectedParticipant}
            label="Participant"
            onChange={(e) => setSelectedParticipant(e.target.value)}
            disabled={!selectedCeremony || participants.length === 0}
          >
            {participants.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateCertificate}
            disabled={loading}
          >
            Générer le certificat
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
      </Box>

      <Typography variant="h5" gutterBottom>
        Certificats générés
      </Typography>
      {certificates.length === 0 ? (
        <Typography>Aucun certificat généré pour cette cérémonie.</Typography>
      ) : (
        certificates.map((cert) => (
          <Box key={cert.id} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography><strong>Participant :</strong> {cert.participantName}</Typography>
            <Typography><strong>Chemin certificat :</strong> {cert.certificatePath}</Typography>
            <Button
              variant="outlined"
              href={cert.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 1 }}
            >
              Télécharger le certificat
            </Button>
          </Box>
        ))
      )}
    </Container>
  );
}
