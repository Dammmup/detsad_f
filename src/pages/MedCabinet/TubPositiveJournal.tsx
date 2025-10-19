import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress
} from '@mui/material';
import { getUsers } from '../../services/users';
import { User } from '../../types/common';
import { TubPositiveRecord } from '../../types/tubPositive';
import {
  getTubPositiveRecords,
  createTubPositiveRecord,
  updateTubPositiveRecord,
  deleteTubPositiveRecord
} from '../../services/tubPositiveJournal';

export default function TubPositiveJournal() {
  const [records, setRecords] = useState<TubPositiveRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<TubPositiveRecord>>({});
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [referral, setReferral] = useState('');
  const [doctor, setDoctor] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUsers().then(users => {
        const children = users.filter(u => u.birthday && u.parentName);
        setUsers(children);
      }),
      getTubPositiveRecords().then(setRecords)
    ]).finally(() => setLoading(false));
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (search) filtered = filtered.filter(r => r.fio.toLowerCase().includes(search.toLowerCase()));
    if (group) filtered = filtered.filter(r => r.group === group);
    if (referral) filtered = filtered.filter(r => r.referral.toLowerCase().includes(referral.toLowerCase()));
    if (doctor) filtered = filtered.filter(r => r.doctor.toLowerCase().includes(doctor.toLowerCase()));
    return filtered;
  }, [records, search, group, referral, doctor]);

  const handleAdd = async () => {
    if (!newRecord.childId || !newRecord.fio || !newRecord.date) return;
    setLoading(true);
    try {
      const created = await createTubPositiveRecord({
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
      await deleteTubPositiveRecord(id);
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
        group: typeof child.groupId === 'object' && child.groupId ? (child.groupId as any).id || (child.groupId as any)._id || '' : child.groupId || '',
      }));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setGroup('');
    setReferral('');
    setDoctor('');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h5" gutterBottom>Журнал туберкулино‑положительных (к фтизиопедиатру)</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>Новая запись</Button>
        <TextField label="Поиск по ФИО" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ minWidth: 180 }} />
        <TextField label="Группа" value={group} onChange={e => setGroup(e.target.value)} size="small" sx={{ minWidth: 120 }} />
        <TextField label="Направление" value={referral} onChange={e => setReferral(e.target.value)} size="small" sx={{ minWidth: 140 }} />
        <TextField label="Врач" value={doctor} onChange={e => setDoctor(e.target.value)} size="small" sx={{ minWidth: 120 }} />
        <Button onClick={handleClearFilters}>Очистить фильтры</Button>
      </Stack>
      <Table size="small" sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Группа</TableCell>
            <TableCell>Дата</TableCell>
            <TableCell>Направление</TableCell>
            <TableCell>Врач</TableCell>
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
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.referral}</TableCell>
              <TableCell>{r.doctor}</TableCell>
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
          <TextField label="Дата" type="date" value={newRecord.date || ''} onChange={e => setNewRecord(r => ({ ...r, date: e.target.value }))} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
          <TextField label="Направление" value={newRecord.referral || ''} onChange={e => setNewRecord(r => ({ ...r, referral: e.target.value }))} fullWidth margin="dense" />
          <TextField label="Врач" value={newRecord.doctor || ''} onChange={e => setNewRecord(r => ({ ...r, doctor: e.target.value }))} fullWidth margin="dense" />
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
