import React, { useEffect, useState } from 'react';
import { Box, Button, Container, TextField, Typography, Alert, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { createCeremony } from '../api/ceremonies';

export default function PlanifyCeremony() {
  const [form, setForm] = useState({ title: '', datetime: '', location: '', description: '', participants: [] });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/users?roles=AGENT_PKI,PARTICIPANT').then(res => {
      const filtered = res.data.filter(u => ['AGENT_PKI', 'PARTICIPANT'].includes(u.role));
      setUsers(filtered);
    });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();

    const payload = {
      titre: form.title,
      description: form.description,
      date_heure: form.datetime,
      lieu: form.location,
      participants: form.participants
    };

    try {
      await createCeremony(payload);
      setMessage({ type: 'success', text: 'Cérémonie planifiée !' });
      setTimeout(() => navigate('/agent-pki/ceremonies'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur lors de la planification' });
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Planifier une cérémonie</Typography>
      {message.text && <Alert severity={message.type}>{message.text}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField label="Titre" name="title" fullWidth sx={{ mb: 2 }} onChange={handleChange} required />
        <TextField label="Date et heure" name="datetime" type="datetime-local" fullWidth sx={{ mb: 2 }} onChange={handleChange} required />
        <TextField label="Lieu ou lien visio" name="location" fullWidth sx={{ mb: 2 }} onChange={handleChange} required />
        <TextField label="Description" name="description" fullWidth multiline rows={3} sx={{ mb: 2 }} onChange={handleChange} required />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Participants</InputLabel>
          <Select
            multiple
            name="participants"
            value={form.participants}
            onChange={e => setForm({ ...form, participants: e.target.value })}
            input={<OutlinedInput label="Participants" />}
            renderValue={(selected) => selected.map(id => {
              const user = users.find(u => u.id === id);
              return user ? user.full_name : id;
            }).join(', ')}
          >
            {users.map(user => (
              <MenuItem key={user.id} value={user.id}>
                <Checkbox checked={form.participants.includes(user.id)} />
                <ListItemText primary={`${user.full_name} (${user.role})`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" type="submit">Créer la cérémonie</Button>
      </Box>
    </Container>
  );
}
