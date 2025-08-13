import React, { useEffect, useState } from 'react';
import {
  Container, Typography, TextField, Button, Box, MenuItem, Select, InputLabel, FormControl, OutlinedInput, Chip
} from '@mui/material';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

export default function CeremoniePlanningPage() {
  const [form, setForm] = useState({
    titre: '',
    date: '',
    heure: '',
    lieu: '',
    description: '',
    participants: []
  });
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/participants')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantsChange = (event) => {
    const { value } = event.target;
    setForm(prev => ({ ...prev, participants: typeof value === 'string' ? value.split(',') : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      datetime: `${form.date}T${form.heure}`
    };
    api.post('/ceremonies', payload)
      .then(() => navigate('/ceremonies'))
      .catch(err => console.error(err));
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Planifier une cérémonie</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField fullWidth label="Titre" name="titre" value={form.titre} onChange={handleChange} margin="normal" required />
        <TextField fullWidth label="Date" name="date" type="date" value={form.date} onChange={handleChange} margin="normal" InputLabelProps={{ shrink: true }} required />
        <TextField fullWidth label="Heure" name="heure" type="time" value={form.heure} onChange={handleChange} margin="normal" InputLabelProps={{ shrink: true }} required />
        <TextField fullWidth label="Lieu (physique ou visio)" name="lieu" value={form.lieu} onChange={handleChange} margin="normal" required />
        <TextField fullWidth label="Description" name="description" multiline rows={4} value={form.description} onChange={handleChange} margin="normal" />

        <FormControl fullWidth margin="normal">
          <InputLabel>Participants</InputLabel>
          <Select
            multiple
            value={form.participants}
            onChange={handleParticipantsChange}
            input={<OutlinedInput label="Participants" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((id) => {
                  const user = users.find(u => u.id === id);
                  return <Chip key={id} label={user ? user.username : id} />;
                })}
              </Box>
            )}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username} ({user.role})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>Planifier</Button>
      </Box>
    </Container>
  );
}
