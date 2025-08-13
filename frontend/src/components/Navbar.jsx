// src/components/Navbar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAccueilClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    switch (user.role) {
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
        navigate('/login');
    }
  };

  const handleCeremoniesClick = () => {
    if (user?.role === 'AGENT_PKI') {
      navigate('/agent-pki/ceremonies');
    } else if (user?.role === 'PARTICIPANT') {
      navigate('/participant/ceremonies');
    } else if (user?.role === 'VERIFICATEUR') {
      navigate('/verificateur/ceremonies');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Mon Application
        </Typography>

        <Button color="inherit" onClick={handleAccueilClick}>
          Accueil
        </Button>

        {(user?.role === 'AGENT_PKI' || user?.role === 'PARTICIPANT' || user?.role === 'VERIFICATEUR') && (
          <Button color="inherit" onClick={handleCeremoniesClick}>
            Cérémonies
          </Button>
        )}

        {user && (
          <Button color="inherit" onClick={handleLogout}>
            Déconnexion
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
