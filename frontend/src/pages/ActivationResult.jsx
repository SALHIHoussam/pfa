import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Container } from '@mui/material';

export default function ActivationResult() {
  const location = useLocation();
  const [status, setStatus] = useState('En attente...');

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.includes("activation-success")) {
      setStatus("Votre compte a été activé avec succès !");
    } else if (pathname.includes("activation-already")) {
      setStatus("Votre compte est déjà activé.");
    } else if (pathname.includes("activation-expired")) {
      setStatus("Lien d’activation expiré.");
    }
  }, [location]);

  return (
    <Container sx={{ mt: 6 }}>
      <Typography variant="h4" textAlign="center">{status}</Typography>
    </Container>
  );
}
