import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { getUsers } from '../../services/users';
import childrenApi from '../../services/children';
import { User } from '../../types/common';
import { ContactInfectionRecord } from '../../types/contactInfection';
import {
  getContactInfectionRecords,
  createContactInfectionRecord,
  deleteContactInfectionRecord,
} from '../../services/contactInfectionJournal';

export default function ContactInfectionJournal() {
  const [records, setRecords] = useState<ContactInfectionRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<ContactInfectionRecord>>(
    {},
  );
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      childrenApi.getAll().then((children) => {
        setUsers(children as any);
      }),
      getContactInfectionRecords().then(setRecords),
    ]).finally(() => setLoading(false));
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (search)
      filtered = filtered.filter((r) =>
        (r.fio || '').toLowerCase().includes(search.toLowerCase()),
      );
    if (group) filtered = filtered.filter((r) => r.group === group);
    return filtered;
  }, [records, search, group]);

  const handleAdd = async () => {
    if (!newRecord.childId || !newRecord.fio || !newRecord.date) return;
    setLoading(true);
    try {
      const created = await createContactInfectionRecord({
        ...newRecord,
        notes: newRecord.notes || '',
      });
      setRecords((prev) => [...prev, created]);
      setModalOpen(false);
      setNewRecord({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteContactInfectionRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (id: string) => {
    const child = users.find((u) => u.id === id || u._id === id);
    if (child) {
      setNewRecord((r) => ({
        ...r,
        childId: id,
        fio: child.fullName || '',
        birthdate: child.birthday || '',
        group:
          typeof child.groupId === 'object' && child.groupId
            ? (child.groupId as any).id || (child.groupId as any)._id || ''
            : child.groupId || '',
      }));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setGroup('');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h5' gutterBottom>
        Журнал учета контактов с острыми инфекционными заболеваниями
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant='contained' onClick={() => setModalOpen(true)}>
          Новая запись
        </Button>
        <TextField
          label='Поиск по ФИО'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size='small'
          sx={{ minWidth: 180 }}
        />
        <TextField
          label='Группа'
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          size='small'
          sx={{ minWidth: 120 }}
        />
        <Button onClick={handleClearFilters}>Очистить фильтры</Button>
      </Stack>
      <Table size='small' sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Дата</TableCell>
            <TableCell>Тип инфекции</TableCell>
            <TableCell>Примечания</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.map((r, idx) => {
            const childInfo = r.childId && typeof r.childId === 'object' ? r.childId as any : null;
            const fio = r.fio || childInfo?.fullName || '';
            const birthdate = r.birthdate || (childInfo?.birthday ? new Date(childInfo.birthday).toLocaleDateString('ru-RU') : '');
            return (
              <TableRow key={r.id || r._id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{fio}</TableCell>
                <TableCell>{birthdate}</TableCell>
                <TableCell>{typeof r.date === 'string' ? new Date(r.date).toLocaleDateString('ru-RU') : r.date?.toLocaleDateString?.('ru-RU') || ''}</TableCell>
                <TableCell>{r.infectionType || '-'}</TableCell>
                <TableCell>{r.notes || '-'}</TableCell>
                <TableCell>
                  <Button
                    color='error'
                    size='small'
                    onClick={() => handleDelete(r.id || r._id || '')}
                  >
                    Удалить
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Новая запись</DialogTitle>
        <DialogContent>
          <TextField
            select
            label='Ребенок'
            value={newRecord.childId || ''}
            onChange={(e) => handleChildSelect(e.target.value)}
            fullWidth
            margin='dense'
          >
            <MenuItem value=''>—</MenuItem>
            {users.map((child) => (
              <MenuItem
                key={child.id || child._id}
                value={child.id || child._id}
              >
                {child.fullName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label='Дата'
            type='date'
            value={newRecord.date || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, date: e.target.value }))
            }
            fullWidth
            margin='dense'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Симптомы'
            value={Array.isArray(newRecord.symptoms) ? newRecord.symptoms.join(', ') : (newRecord.symptoms || '')}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, symptoms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))
            }
            helperText='Через запятую'
            fullWidth
            margin='dense'
          />
          <TextField
            label='Стул'
            value={newRecord.stool || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, stool: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Примечания'
            value={newRecord.notes || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, notes: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleAdd} variant='contained'>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      {loading && (
        <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%' }} />
      )}
    </Box>
  );
}
