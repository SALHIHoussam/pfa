import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import api from '../api/axiosInstance';

export default function VerificationPage() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    try {
      const res = await api.get(`/certificats/verifier/${certId}`);
      setResult(res.data);
    } catch (err) {
      setResult({ valid: false, message: 'Certificat non valide ou inexistant' });
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Vérification de Certificat</Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="ID du certificat"
          value={certId}
          onChange={e => setCertId(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleVerify}>Vérifier</Button>
      </Box>
      {result && (
        <Typography color={result.valid ? 'green' : 'red'}>
          {result.message || (result.valid ? 'Certificat valide' : 'Certificat invalide')}
        </Typography>
      )}
    </Container>
  );
}
