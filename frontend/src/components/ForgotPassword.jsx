import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import api from '../api/axiosInstance';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: 'Un lien a été envoyé à votre adresse email.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la demande.'
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 5, p: 3 }}>
      <Typography variant="h5" gutterBottom>Mot de passe oublié</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      <TextField
        label="Adresse email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" fullWidth>
        Envoyer le lien
      </Button>
    </Box>
  );
}
