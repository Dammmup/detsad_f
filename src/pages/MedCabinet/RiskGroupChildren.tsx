import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress
} from '@mui/material';
import { getUsers } from '../../services/users';
import { User } from '../../types/common';
import { RiskGroupChild } from '../../types/riskGroupChild';
import {
  getRiskGroupChildren,
  createRiskGroupChild,
  updateRiskGroupChild,
  deleteRiskGroupChild
} from '../../services/riskGroupChildren';

export default function RiskGroupChildren() {
  const [records, setRecords] = useState<RiskGroupChild[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<RiskGroupChild>>({});
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUsers().then(users => {
        const children = users.filter(u => u.birthday && u.parentName);
        setUsers(children);
      }),
      getRiskGroupChildren().then(setRecords)
    ]).finally(() => setLoading(false));
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (search) filtered = filtered.filter(r => r.fio.toLowerCase().includes(search.toLowerCase()));
    if (group) filtered = filtered.filter(r => r.group === group);
    if (reason) filtered = filtered.filter(r => r.reason.toLowerCase().includes(reason.toLowerCase()));
    return filtered;
  }, [records, search, group, reason]);

  const handleAdd = async () => {
    if (!newRecord.childId || !newRecord.fio || !newRecord.group || !newRecord.reason) return;
    setLoading(true);
    try {
      const created = await createRiskGroupChild({
        ...newRecord,
        notes: newRecord.notes || '',
      });
      setRecords(prev => [...prev, created]);
      setModalOpen(false);
      setNewRecord({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteRiskGroupChild(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (id: string) => {
    const child = users.find(u => u.id === id || u._id === id);
    if (child) {
      setNewRecord(r => ({
        ...r,
        childId: id,
        fio: child.fullName || '',
        birthdate: child.birthday || '',
        group: child.groupId || '',
        address: child.notes || '',
      }));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setGroup('');
    setReason('');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h5" gutterBottom>Список детей группы риска</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>Новая запись</Button>
        <TextField label="Поиск по ФИО" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ minWidth: 180 }} />
        <TextField label="Группа" value={group} onChange={e => setGroup(e.target.value)} size="small" sx={{ minWidth: 120 }} />
        <TextField label="Основание" value={reason} onChange={e => setReason(e.target.value)} size="small" sx={{ minWidth: 140 }} />
        <Button onClick={handleClearFilters}>Очистить фильтры</Button>
      </Stack>
      <Table size="small" sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Группа</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell>Основание</TableCell>
            <TableCell>Примечания</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.map((r, idx) => (
            <TableRow key={r.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{r.fio}</TableCell>
              <TableCell>{r.birthdate}</TableCell>
              <TableCell>{r.group}</TableCell>
              <TableCell>{r.address}</TableCell>
              <TableCell>{r.reason}</TableCell>
              <TableCell>{r.notes}</TableCell>
              <TableCell>
                <Button color="error" size="small" onClick={() => handleDelete(r.id)}>Удалить</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Новая запись</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Ребенок"
            value={newRecord.childId || ''}
            onChange={e => handleChildSelect(e.target.value)}
            fullWidth
            margin="dense"
          >
            <MenuItem value="">—</MenuItem>
            {users.map(child => (
              <MenuItem key={child.id || child._id} value={child.id || child._id}>{child.fullName}</MenuItem>
            ))}
          </TextField>
          <TextField label="Основание" value={newRecord.reason || ''} onChange={e => setNewRecord(r => ({ ...r, reason: e.target.value }))} fullWidth margin="dense" />
          <TextField label="Примечания" value={newRecord.notes || ''} onChange={e => setNewRecord(r => ({ ...r, notes: e.target.value }))} fullWidth margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleAdd} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
      {loading && <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%' }} />}
    </Box>
  );
}
