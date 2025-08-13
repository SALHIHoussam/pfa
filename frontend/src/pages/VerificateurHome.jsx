import React from 'react';
import { Box, Typography } from '@mui/material';

const VerificateurHome = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Bienvenue Vérificateur</Typography>
      <Typography>Vous pouvez vérifier l’authenticité des certificats ici.</Typography>
    </Box>
  );
};

export default VerificateurHome;
