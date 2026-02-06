import React, { useState, useMemo, useEffect } from 'react';
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
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { getUsers } from '../../staff/services/userService';
import childrenApi from '../../children/services/children';
import { User, Child } from '../../../shared/types/common';
import {
  getSomaticRecords,
  createSomaticRecord,
  deleteSomaticRecord,
} from '../services/somaticJournal';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
} from 'docx';
import { saveAs } from 'file-saver';

import { SomaticRecord } from '../../../shared/types/somatic';
import { AnyAaaaRecord } from 'dns';

export default function SomaticJournal() {
  const [records, setRecords] = useState<SomaticRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [onlyCurrentYear, setOnlyCurrentYear] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<SomaticRecord>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      childrenApi.getAll().then(setChildren),
      getSomaticRecords().then(setRecords),
    ]).finally(() => setLoading(false));
  }, []);


  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (search) {
      filtered = filtered.filter((r) =>
        (r.fio || (r.childId && typeof r.childId === 'object' && (r.childId as any).fullName) || '').toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (diagnosisFilter) {
      filtered = filtered.filter((r) =>
        (r.diagnosis || '').toLowerCase().includes(diagnosisFilter.toLowerCase()),
      );
    }
    if (fromDate) {
      filtered = filtered.filter((r) => (r.fromDate || '') >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((r) => (r.toDate || '') <= toDate);
    }
    if (onlyCurrentYear) {
      const year = new Date().getFullYear();
      filtered = filtered.filter(
        (r) => {
          // Check date field (from backend)
          const dateStr = r.date ? String(r.date).substring(0, 4) : '';
          // Also check legacy fromDate/toDate fields
          return dateStr === year.toString() ||
            (r.fromDate || '').startsWith(year.toString()) ||
            (r.toDate || '').startsWith(year.toString());
        }
      );
    }
    return filtered;
  }, [records, search, diagnosisFilter, fromDate, toDate, onlyCurrentYear]);


  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const totalDays = filteredRecords.reduce(
      (sum, r) => sum + (r.days || 0),
      0,
    );
    return { total, totalDays };
  }, [filteredRecords]);


  const handleAdd = async () => {
    if (
      !newRecord.childId ||
      !newRecord.fio ||
      !newRecord.diagnosis ||
      !newRecord.fromDate ||
      !newRecord.toDate
    )
      return;
    setLoading(true);
    try {
      const from = new Date(newRecord.fromDate!);
      const to = new Date(newRecord.toDate!);
      const days = Math.max(
        1,
        Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      );
      const created = await createSomaticRecord({
        ...newRecord,
        date: newRecord.fromDate, // Backend requires 'date' field
        treatment: newRecord.treatment || 'Не указано', // Backend requires 'treatment'
        days,
        notes: newRecord.notes || '',
        birthdate: newRecord.birthdate || '',
        address: newRecord.address || '',
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
      await deleteSomaticRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setLoading(false);
    }
  };


  const handleExport = () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'Журнал соматической заболеваемости',
              heading: HeadingLevel.HEADING_1,
            }),
            new DocxTable({
              rows: [
                new DocxTableRow({
                  children: [
                    '№',
                    'ФИО',
                    'Дата рождения',
                    'Адрес',
                    'Диагноз',
                    'С даты',
                    'По дату',
                    'Всего дней',
                    'Примечания',
                  ].map(
                    (h) => new DocxTableCell({ children: [new Paragraph(h)] }),
                  ),
                }),
                ...filteredRecords.map(
                  (r, idx) =>
                    new DocxTableRow({
                      children: [
                        String(idx + 1),
                        r.fio ?? '',
                        r.birthdate ?? '',
                        r.address ?? '',
                        r.diagnosis ?? '',
                        r.fromDate ?? '',
                        r.toDate ?? '',
                        String(r.days ?? ''),
                        r.notes ?? '',
                      ].map(
                        (val) =>
                          new DocxTableCell({ children: [new Paragraph(val)] }),
                      ),
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'Журнал_соматической_заболеваемости.docx');
    });
  };


  const handleChildSelect = (id: string) => {
    const child = children.find((c) => c.id === id || c._id === id);
    if (child) {
      setNewRecord((r) => ({
        ...r,
        childId: id,
        fio: child.fullName || '',
        birthdate: child.birthday || '',
        address: child.notes || '',
      }));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDiagnosisFilter('');
    setFromDate('');
    setToDate('');
    setOnlyCurrentYear(false);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h5' gutterBottom>
        Журнал соматической заболеваемости
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant='contained' onClick={() => setModalOpen(true)}>
          Новая запись
        </Button>
        <Button variant='outlined' onClick={handleExport}>
          Экспорт
        </Button>
        <TextField
          label='Поиск по ФИО'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size='small'
          sx={{ minWidth: 200 }}
        />
        <TextField
          label='Диагноз'
          value={diagnosisFilter}
          onChange={(e) => setDiagnosisFilter(e.target.value)}
          size='small'
          sx={{ minWidth: 180 }}
        />
        <TextField
          label='С какого числа'
          type='date'
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          size='small'
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label='По какое число'
          type='date'
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          size='small'
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={onlyCurrentYear}
              onChange={(e) => setOnlyCurrentYear(e.target.checked)}
            />
          }
          label='Только текущий год'
        />
        <Button onClick={handleClearFilters}>Очистить фильтры</Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Всего записей: {stats.total}</Typography>
        <Typography>Всего дней: {stats.totalDays}</Typography>
      </Paper>
      <Table size='small' sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell>Диагноз</TableCell>
            <TableCell>С даты</TableCell>
            <TableCell>По дату</TableCell>
            <TableCell>Всего дней</TableCell>
            <TableCell>Примечания</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.map((r, idx) => {
            // Get child info from populated childId or use legacy fields
            const childInfo = r.childId && typeof r.childId === 'object' ? r.childId as any : null;
            const fio = r.fio || childInfo?.fullName || '';
            const birthdate = r.birthdate || (childInfo?.birthday ? new Date(childInfo.birthday).toLocaleDateString('ru-RU') : '');
            const address = r.address || childInfo?.address || '';
            // Format dates
            const dateStr = r.date ? new Date(r.date).toLocaleDateString('ru-RU') : '';
            const fromDateStr = r.fromDate || dateStr;
            const toDateStr = r.toDate || dateStr;

            return (
              <TableRow key={r.id || r._id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{fio}</TableCell>
                <TableCell>{birthdate}</TableCell>
                <TableCell>{address}</TableCell>
                <TableCell>{r.diagnosis}</TableCell>
                <TableCell>{fromDateStr}</TableCell>
                <TableCell>{toDateStr}</TableCell>
                <TableCell>{r.days || ''}</TableCell>
                <TableCell>{r.notes}</TableCell>
                <TableCell>
                  <Button
                    color='error'
                    size='small'
                    onClick={() => handleDelete(r.id || r._id as any)}
                  >
                    Удалить
                  </Button>
                  {/* Для редактирования можно добавить отдельную кнопку/диалог */}
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
            {children.map((child) => (
              <MenuItem
                key={child.id || child._id}
                value={child.id || child._id}
              >
                {child.fullName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label='Диагноз'
            value={newRecord.diagnosis || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, diagnosis: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Лечение'
            value={newRecord.treatment || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, treatment: e.target.value }))
            }
            fullWidth
            margin='dense'
            multiline
            rows={2}
          />
          <TextField
            label='С даты'
            type='date'
            value={newRecord.fromDate || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, fromDate: e.target.value }))
            }
            fullWidth
            margin='dense'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='По дату'
            type='date'
            value={newRecord.toDate || ''}
            onChange={(e) =>
              setNewRecord((r) => ({ ...r, toDate: e.target.value }))
            }
            fullWidth
            margin='dense'
            InputLabelProps={{ shrink: true }}
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
