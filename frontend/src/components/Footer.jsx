import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ textAlign: 'center', py: 2, mt: 4, backgroundColor: '#f0f0f0' }}>
      <Typography variant="body2">&copy; 2025 Plateforme Certificats - ANCE TUNTRUST</Typography>
    </Box>
  );
}
