import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setMessage({ type: 'success', text: 'Mot de passe réinitialisé avec succès !' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la réinitialisation.'
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', mt: 5, p: 3 }}>
      <Typography variant="h5" gutterBottom>Réinitialiser le mot de passe</Typography>
      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      <TextField
        label="Nouveau mot de passe"
        type="password"
        fullWidth
        required
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" fullWidth>
        Réinitialiser
      </Button>
    </Box>
  );
}
