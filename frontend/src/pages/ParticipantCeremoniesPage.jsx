import React, { useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useCeremonies from '../hooks/useCeremonies';
import StatutBadge from '../components/StatutBadge';
import NotificationAlert from '../components/NotificationAlert';
import CeremonieCard from '../components/CeremonieCard';
import { useTheme } from '@mui/material/styles';

export default function CeremoniesVerificateurPage() {
  const { ceremonies, loading } = useCeremonies();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSeverity, setNotifSeverity] = useState('success');

  if (loading) {
    return <Typography sx={{ mt: 4, textAlign: 'center' }}>Chargement...</Typography>;
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Liste des Cérémonies</Typography>

      {/* Version Table pour desktop */}
      {!isMobile && (
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ceremonies.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.titre}</TableCell>
                <TableCell>{new Date(c.date_heure).toLocaleString()}</TableCell>
                <TableCell>{c.lieu}</TableCell>
                <TableCell>
                  <StatutBadge statut={c.statut} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Version cartes pour mobile */}
      {isMobile && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {ceremonies.map(c => (
            <Grid item xs={12} key={c.id}>
              <CeremonieCard
                ceremonie={c}
                onVoir={() => navigate(`/participant/ceremonies/${c.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Notification globale */}
      <NotificationAlert
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        message={notifMessage}
        severity={notifSeverity}
      />
    </Container>
  );
}
