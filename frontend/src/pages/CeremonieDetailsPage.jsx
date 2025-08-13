import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Box, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Chip,
  OutlinedInput, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  fetchCeremonyById,
  updateCeremony,
  cancelCeremony,
  // markAsDone // tu peux supprimer si tu ne l'utilises plus
} from '../api/ceremonies';
import api from '../api/axiosInstance';
import StatutBadge from '../components/StatutBadge';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function CeremonieDetailsPage() {
  const { id } = useParams();

  const [ceremony, setCeremony] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: '',
    datetime: '',
    location: '',
    description: '',
    participants: [],
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');

  const fetchUserRole = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setCurrentUserRole(payload.role);
        console.log('Rôle utilisateur depuis token:', payload.role);
        return;
      }
    }
    setCurrentUserRole('');
    console.log('Rôle utilisateur non trouvé');
  }, []);

  const fetchCeremony = useCallback(async () => {
    try {
      const res = await fetchCeremonyById(id);
      const data = res.data;
      setCeremony(data);
      setForm({
        title: data.titre,
        datetime: data.date_heure.slice(0, 16),
        location: data.lieu,
        description: data.description || '',
        participants: data.participants.map(p => p.id),
      });
    } catch (err) {
      setError("Erreur lors du chargement de la cérémonie.");
    }
  }, [id]);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await api.get('/auth/users?roles=AGENT_PKI,PARTICIPANT');
      setAllParticipants(res.data);
    } catch (err) {
      console.error('Erreur chargement participants', err);
    }
  }, []);

  useEffect(() => {
    fetchCeremony();
    fetchParticipants();
    fetchUserRole();
  }, [fetchCeremony, fetchParticipants, fetchUserRole]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const statut = ceremony
    ? typeof ceremony.statut === 'string'
      ? ceremony.statut
      : ceremony.statut?.value || ceremony.statut?.name || ''
    : '';

  console.log('Rôle utilisateur:', currentUserRole);
  console.log('Statut cérémonie:', statut);

  const canEdit = ceremony && statut === 'Planifiée' && currentUserRole === 'ADMIN';
  const canCancel = ceremony && statut === 'Planifiée' && ['ADMIN', 'AGENT_PKI', 'PARTICIPANT'].includes(currentUserRole);
  // const canMarkDone = ceremony && statut === 'Planifiée' && ['ADMIN', 'AGENT_PKI'].includes(currentUserRole); // Plus utilisé

  console.log('Peut modifier:', canEdit);
  console.log('Peut annuler:', canCancel);

  const handleSubmitEdit = async () => {
    try {
      await updateCeremony(id, {
        titre: form.title,
        date_heure: form.datetime,
        lieu: form.location,
        description: form.description,
        participants: form.participants,
      });
      setSuccessMsg('Cérémonie modifiée avec succès.');
      setEditMode(false);
      fetchCeremony();
    } catch (err) {
      setError("Erreur lors de la modification.");
    }
  };

  const handleCancelCeremony = async () => {
    try {
      await cancelCeremony(id);
      setSuccessMsg('Cérémonie annulée.');
      fetchCeremony();
      setDialogOpen(false);
    } catch (err) {
      setError("Erreur lors de l'annulation.");
    }
  };

  if (!ceremony) return <Container>Chargement...</Container>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Détails de la cérémonie</Typography>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {!editMode ? (
        <>
          <Box mb={2}>
            <Typography variant="h5">{ceremony.titre}</Typography>
            <StatutBadge statut={statut} />
            <Typography>Date et heure : {new Date(ceremony.date_heure).toLocaleString()}</Typography>
            <Typography>Lieu : {ceremony.lieu}</Typography>
            <Typography>Description : {ceremony.description}</Typography>
            <Typography variant="h6" mt={2}>Participants :</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {ceremony.participants.map(p => (
                <Chip key={p.id} label={`${p.full_name} (${p.role})`} />
              ))}
            </Stack>
          </Box>

          {canEdit && (
            <Button variant="contained" onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
              Modifier la cérémonie
            </Button>
          )}
          {canCancel && (
            <Button variant="outlined" color="error" onClick={() => setDialogOpen(true)} sx={{ mr: 1 }}>
              Annuler la cérémonie
            </Button>
          )}
        </>
      ) : (
        <>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <TextField label="Titre / Sujet" value={form.title} onChange={handleChange('title')} fullWidth />
            <TextField
              label="Date et heure"
              type="datetime-local"
              value={form.datetime}
              onChange={handleChange('datetime')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Lieu (physique ou lien visio)" value={form.location} onChange={handleChange('location')} fullWidth />
            <TextField label="Description" multiline rows={3} value={form.description} onChange={handleChange('description')} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Participants</InputLabel>
              <Select
                multiple
                value={form.participants}
                onChange={handleChange('participants')}
                input={<OutlinedInput label="Participants" />}
                renderValue={(selected) => {
                  const names = selected.map(id => {
                    const user = allParticipants.find(u => u.id === id);
                    return user ? user.name : '';
                  }).filter(n => n !== '');
                  return names.join(', ');
                }}
                MenuProps={MenuProps}
              >
                {allParticipants.map((user) => (
                  <MenuItem key={user.id} value={user.id}>{user.name} ({user.role})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Button variant="contained" onClick={handleSubmitEdit} sx={{ mr: 1 }}>Sauvegarder</Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>Annuler</Button>
            </Box>
          </Box>
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirmer l'annulation</DialogTitle>
        <DialogContent>Êtes-vous sûr de vouloir annuler cette cérémonie ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Non</Button>
          <Button color="error" onClick={handleCancelCeremony}>Oui, annuler</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
