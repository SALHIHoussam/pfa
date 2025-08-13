import React from 'react';
import { Container, Typography, Button, Stack } from '@mui/material';
import UserTable from '../components/UserTable';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>Gestion des Utilisateurs</Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Déconnexion
        </Button>
      </Stack>
      <UserTable />
    </Container>
  );
}
