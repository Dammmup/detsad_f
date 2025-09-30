import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress
} from '@mui/material';
import { getUsers } from '../../services/users';
import { User } from '../../types/common';
import { MantouxRecord } from '../../types/mantoux';
import {
  getMantouxRecords,
  createMantouxRecord,
  updateMantouxRecord,
  deleteMantouxRecord
} from '../../services/mantouxJournal';
import { Document, Packer, Paragraph, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell } from 'docx';
import { saveAs } from 'file-saver';


export default function MantouxJournal() {
  const [records, setRecords] = useState<MantouxRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MantouxRecord>>({ mm: 0 });

  // Статистика
  const stats = useMemo(() => {
    const total = records.length;
    const with063 = records.filter(r => r.has063).length;
    const without063 = total - with063;
    return { total, with063, without063 };
  }, [records]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUsers().then(users => {
        const children = users.filter(u => u.birthday && u.parentName);
        setUsers(children);
      }),
      getMantouxRecords().then(setRecords)
    ]).finally(() => setLoading(false));
  }, []);

  // Фильтрация по ФИО
  const filteredRecords = useMemo(() => {
    if (!search) return records;
    return records.filter(r => r.fio.toLowerCase().includes(search.toLowerCase()));
  }, [records, search]);

  // Добавление новой записи (через API)
  const handleAdd = async () => {
    if (!newRecord.childId || !newRecord.fio) return;
    setLoading(true);
    try {
      const created = await createMantouxRecord({
        ...newRecord,
        mm: Number(newRecord.mm) || 0,
        has063: Boolean(newRecord.has063),
        address: newRecord.address || '',
        birthdate: newRecord.birthdate || '',
        year: newRecord.year || new Date().getFullYear().toString(),
        atr: newRecord.atr || '',
        diagnosis: newRecord.diagnosis || '',
      });
      setRecords(prev => [...prev, created]);
      setModalOpen(false);
      setNewRecord({ mm: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Удаление записи
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteMantouxRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } finally {
      setLoading(false);
    }
  };

  // Обновление записи (редактирование)
  const handleUpdate = async (id: string, updated: Partial<MantouxRecord>) => {
    setLoading(true);
    try {
      const rec = await updateMantouxRecord(id, updated);
      setRecords(prev => prev.map(r => (r.id === id ? rec : r)));
    } finally {
      setLoading(false);
    }
  };

  // Экспорт в Word
  const handleExport = () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: 'Журнал регистрации проб Манту', heading: HeadingLevel.HEADING_1 }),
            new DocxTable({
              rows: [
                new DocxTableRow({
                  children: [
                    '№', 'ФИО', 'Адрес', 'Дата рождения', 'Год', 'АТР', 'Диагноз', 'мм', '063'
                  ].map(h => new DocxTableCell({ children: [new Paragraph(h)] })),
                }),
                ...records.map((r, idx) => new DocxTableRow({
                  children: [
                    String(idx + 1), r.fio, r.address, r.birthdate, r.year, r.atr, r.diagnosis, String(r.mm), r.has063 ? 'Да' : 'Нет'
                  ].map(val => new DocxTableCell({ children: [new Paragraph(val ?? '')] })),
                })),
              ],
            }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'Журнал_Манту.docx');
    });
  };

  // При выборе ребенка автозаполняем поля
  const handleChildSelect = (id: string) => {
    const child = users.find(u => u.id === id || u._id === id);
    if (child) {
      setNewRecord(r => ({
        ...r,
        childId: id,
        fio: child.fullName || '',
        address: child.notes || '',
        birthdate: child.birthday || '',
      }));
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h5" gutterBottom>Журнал регистрации проб Манту</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant="contained" onClick={() => setModalOpen(true)}>Новая запись</Button>
        <Button variant="outlined" onClick={handleExport}>Экспорт в Word</Button>
        <TextField
          label="Поиск по ФИО"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Всего записей: {stats.total}</Typography>
        <Typography>С данными 063: {stats.with063}</Typography>
        <Typography>Без данных 063: {stats.without063}</Typography>
      </Paper>
      <Table size="small" sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Год</TableCell>
            <TableCell>АТР</TableCell>
            <TableCell>Диагноз</TableCell>
            <TableCell>мм</TableCell>
            <TableCell>063</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.map((r, idx) => (
            <TableRow key={r.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{r.fio}</TableCell>
              <TableCell>{r.address}</TableCell>
              <TableCell>{r.birthdate}</TableCell>
              <TableCell>{r.year}</TableCell>
              <TableCell>{r.atr}</TableCell>
              <TableCell>{r.diagnosis}</TableCell>
              <TableCell>{r.mm}</TableCell>
              <TableCell>{r.has063 ? 'Да' : 'Нет'}</TableCell>
              <TableCell>
                <Button color="error" size="small" onClick={() => handleDelete(r.id)}>Удалить</Button>
                {/* Для редактирования можно добавить отдельную кнопку/диалог */}
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
          <TextField
            label="мм (0-50)"
            type="number"
            inputProps={{ min: 0, max: 50 }}
            value={newRecord.mm || ''}
            onChange={e => setNewRecord(r => ({ ...r, mm: Math.max(0, Math.min(50, Number(e.target.value))) }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Год"
            value={newRecord.year || new Date().getFullYear()}
            onChange={e => setNewRecord(r => ({ ...r, year: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="АТР"
            value={newRecord.atr || ''}
            onChange={e => setNewRecord(r => ({ ...r, atr: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Диагноз"
            value={newRecord.diagnosis || ''}
            onChange={e => setNewRecord(r => ({ ...r, diagnosis: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <TextField
            select
            label="Данные 063"
            value={newRecord.has063 ? 'yes' : 'no'}
            onChange={e => setNewRecord(r => ({ ...r, has063: e.target.value === 'yes' }))}
            fullWidth
            margin="dense"
          >
            <MenuItem value="yes">Есть</MenuItem>
            <MenuItem value="no">Нет</MenuItem>
          </TextField>
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
