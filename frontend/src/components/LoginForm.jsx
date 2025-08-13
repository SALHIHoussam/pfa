import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Stack, Link
} from '@mui/material';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', formData);

      const token = response.data.access_token;
      localStorage.setItem('token', token);

      const decoded = jwtDecode(token);

      setMessage({ type: 'success', text: response.data.message });

      switch (decoded.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'AGENT_PKI':
          navigate('/agent-pki');
          break;
        case 'PARTICIPANT':
          navigate('/participant');
          break;
        case 'VERIFICATEUR':
          navigate('/verificateur');
          break;
        default:
          setMessage({ type: 'error', text: 'Rôle non reconnu.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Erreur lors de la connexion'
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Connexion</Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
      )}

      <TextField
        label="Email"
        name="email"
        type="email"
        fullWidth
        required
        sx={{ mb: 2 }}
        onChange={handleChange}
      />

      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        fullWidth
        required
        sx={{ mb: 1 }}
        onChange={handleChange}
      />

      <Box sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/forgot-password')}
          sx={{ textTransform: 'none', fontSize: 14 }}
        >
          Mot de passe oublié ?
        </Link>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button type="submit" variant="contained" sx={{ flexGrow: 1 }}>
          Se connecter
        </Button>

        <Button
          variant="outlined"
          sx={{ flexGrow: 1 }}
          type="button"
          onClick={() => navigate('/register')}
        >
          S'inscrire
        </Button>
      </Stack>
    </Box>
  );
}
