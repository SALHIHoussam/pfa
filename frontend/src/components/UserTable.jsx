import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Select, MenuItem, Switch, IconButton, Tooltip, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axiosInstance';

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    await api.put(`/auth/users/${id}/role`, { role: newRole });
    fetchUsers();
  };

  const handleActiveToggle = async (id, isActive) => {
    await api.put(`/auth/users/${id}/status`, { is_active: isActive });
    fetchUsers();
  };

  const handleDelete = async id => {
    if (window.confirm('Confirmer la suppression ?')) {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    }
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Actif</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => {
              const isAdmin = user.role === 'ADMIN';
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      size="small"
                      disabled={isAdmin}
                    >
                      <MenuItem value="AGENT_PKI">Agent PKI</MenuItem>
                      <MenuItem value="PARTICIPANT">Participant</MenuItem>
                      <MenuItem value="VERIFICATEUR">Vérificateur</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onChange={e => handleActiveToggle(user.id, e.target.checked)}
                      disabled={isAdmin}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={isAdmin ? "Action désactivée pour l'admin" : "Supprimer"}>
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(user.id)}
                          disabled={isAdmin}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
