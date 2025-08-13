import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5, p: 3 }}>
      <Typography variant="h4" gutterBottom textAlign="center">
        Choisissez votre rôle pour vous inscrire
      </Typography>

      <Button
        variant="contained"
        fullWidth
        sx={{ mb: 2 }}
        onClick={() => navigate('/register/agent-pki')}
      >
        Agent PKI
      </Button>

      <Button
        variant="contained"
        fullWidth
        sx={{ mb: 2 }}
        onClick={() => navigate('/register/participant')}
      >
        Participant
      </Button>

      <Button
        variant="contained"
        fullWidth
        onClick={() => navigate('/register/verificateur')}
      >
        Vérificateur
      </Button>
    </Box>
  );
}
