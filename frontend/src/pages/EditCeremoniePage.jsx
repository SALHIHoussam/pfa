import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, MenuItem, Box, CircularProgress } from '@mui/material';
import api from '../api/axiosInstance';

export default function EditCeremoniePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    location: '',
    description: '',
    participants: [],
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await api.get(`/reunions/${id}`);
        const usersRes = await api.get('/users');
        setFormData({
          title: data.title,
          datetime: data.datetime,
          location: data.location,
          description: data.description,
          participants: data.participants.map(p => p.id),
        });
        setUsers(usersRes.data.filter(u => ['AGENT_PKI', 'PARTICIPANT'].includes(u.role)));
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantsChange = e => {
    const value = Array.from(e.target.selectedOptions, opt => opt.value);
    setFormData(prev => ({ ...prev, participants: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.put(`/reunions/${id}`, formData);
      navigate(`/agent-pki/ceremonies/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Modifier la Cérémonie</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Titre" name="title" value={formData.title} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
        <TextField
          label="Date et Heure"
          name="datetime"
          type="datetime-local"
          value={formData.datetime}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField label="Lieu" name="location" value={formData.location} onChange={handleChange} fullWidth sx={{ mb: 2 }} />
        <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={3} sx={{ mb: 2 }} />

        <TextField
          label="Participants"
          select
          fullWidth
          SelectProps={{ multiple: true, native: true }}
          value={formData.participants}
          onChange={handleParticipantsChange}
          sx={{ mb: 2 }}
        >
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.full_name} ({user.role})</option>
          ))}
        </TextField>

        <Button type="submit" variant="contained" color="primary">Enregistrer les modifications</Button>
      </form>
    </Container>
  );
}
