import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Select, MenuItem, Button, Box, TextField
} from '@mui/material';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import StatutBadge from '../components/StatutBadge';

export default function CeremoniesListPage() {
  const [ceremonies, setCeremonies] = useState([]);
  const [filteredCeremonies, setFilteredCeremonies] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Charger la liste des cérémonies
  useEffect(() => {
    fetchCeremonies();
  }, []);

  // Refiltrer à chaque changement filter/search
  useEffect(() => {
    let filtered = [...ceremonies];
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (search) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredCeremonies(filtered);
  }, [statusFilter, search, ceremonies]);

  const fetchCeremonies = async () => {
    try {
      const res = await api.get('/ceremonies');
      setCeremonies(res.data);
    } catch (err) {
      console.error('Erreur chargement cérémonies', err);
    }
  };

  const handleDownloadReport = ceremonyId => {
    // Télécharger le PDF du rapport depuis backend
    window.open(`${api.defaults.baseURL}/ceremonies/${ceremonyId}/rapport`, '_blank');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Historique des Cérémonies Cryptographiques
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tous statuts</MenuItem>
          <MenuItem value="PLANIFIEE">Planifiée</MenuItem>
          <MenuItem value="REALISEE">Réalisée</MenuItem>
          <MenuItem value="ANNULEE">Annulée</MenuItem>
        </Select>

        <TextField
          placeholder="Recherche par titre ou description"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Date & Heure</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCeremonies.map(ceremony => (
              <TableRow key={ceremony.id} hover>
                <TableCell>{ceremony.title}</TableCell>
                <TableCell>{new Date(ceremony.datetime).toLocaleString()}</TableCell>
                <TableCell>{ceremony.location}</TableCell>
                <TableCell>{ceremony.description}</TableCell>
                <TableCell><StatutBadge statut={ceremony.status} /></TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => navigate(`/ceremonies/${ceremony.id}`)}
                  >
                    Voir détails
                  </Button>

                  {ceremony.status === 'REALISEE' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleDownloadReport(ceremony.id)}
                    >
                      Télécharger rapport
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {filteredCeremonies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">Aucune cérémonie trouvée.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
