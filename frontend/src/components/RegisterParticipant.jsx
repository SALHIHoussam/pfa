import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../api/axiosInstance';

export default function RegisterParticipant() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    organization: '',
    ceremony_role: '',
    id_type: '',
    id_number: '',
    mobile: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', {
        ...formData,
        role: 'PARTICIPANT'
      });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>Inscription - Participant</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      <TextField label="Nom complet" name="full_name" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Email" name="email" type="email" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Mot de passe" name="password" type="password" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />

      <TextField label="Organisation" name="organization" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Rôle dans la cérémonie" name="ceremony_role" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Type d'identification" name="id_type" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Numéro d'identification" name="id_number" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />
      <TextField label="Téléphone mobile" name="mobile" fullWidth required sx={{ mb: 2 }} onChange={handleChange} />

      <Button type="submit" variant="contained" fullWidth>Créer un compte</Button>
    </Box>
  );
}
