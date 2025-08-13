import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../api/axiosInstance';

export default function RegisterVerificateur() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    organization: '',
    verification_type: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', {
        ...formData,
        role: 'VERIFICATEUR'
      });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Inscription - Vérificateur</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TextField label="Nom complet" name="full_name" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Email" name="email" type="email" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Mot de passe" name="password" type="password" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />

      <TextField label="Organisation" name="organization" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Type de vérification" name="verification_type" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />

      <Button type="submit" variant="contained" fullWidth>Créer un compte</Button>
    </Box>
  );
}
