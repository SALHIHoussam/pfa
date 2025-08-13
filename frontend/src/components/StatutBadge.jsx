import React from 'react';
import { Chip } from '@mui/material';

const statutColors = {
  PLANIFIEE: 'warning',  // jaune
  REALISEE: 'success',  // vert
  ANNULEE: 'error',     // rouge
};

const statutLabels = {
  PLANIFIEE: 'Planifiée',
  REALISEE: 'Réalisée',
  ANNULEE: 'Annulée',
};

export default function StatutBadge({ statut }) {
  const color = statutColors[statut] || 'default';
  const label = statutLabels[statut] || statut;

  return <Chip label={label} color={color} size="small" />;
}
