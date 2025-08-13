import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../api/axiosInstance';

export default function RegisterAgentPKI() {
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '',
    badge_number: '', unit: '', experience_years: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', {
        ...formData,
        role: 'AGENT_PKI'
      });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Inscription - Agent PKI</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TextField label="Nom complet" name="full_name" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Email" name="email" type="email" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Mot de passe" name="password" type="password" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Matricule" name="badge_number" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Unité" name="unit" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Années d'expérience" name="experience_years" type="number" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />

      <Button type="submit" variant="contained" fullWidth>Créer un compte</Button>
    </Box>
  );
}
