import React from 'react';
import { Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatutBadge from './StatutBadge';

export default function CeremonieCard({ ceremonie }) {
  const navigate = useNavigate();

  const {
    id,
    titre,
    dateHeure,
    lieu,
    statut,
    participants,
  } = ceremonie;

  const formattedDate = new Date(dateHeure).toLocaleString();

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{titre}</Typography>
          <StatutBadge statut={statut} />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Date & heure : {formattedDate}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Lieu : {lieu}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Participants : {Array.isArray(participants) ? participants.length : 0}
        </Typography>

        <Stack direction="row" spacing={2} mt={2}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => navigate(`/ceremonies/${id}`)}
          >
            Voir détails
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => navigate(`/ceremonies/${id}/rapport`)}
            disabled={statut !== 'REALISEE'}
          >
            Télécharger rapport
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
