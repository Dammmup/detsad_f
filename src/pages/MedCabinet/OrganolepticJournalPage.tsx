import React, { useEffect, useState, useCallback } from 'react';
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
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { OrganolepticRecord } from '../../types/organoleptic';
import {
  getOrganolepticRecords,
  createOrganolepticRecord,
  updateOrganolepticRecord,
  deleteOrganolepticRecord,
  clearOrganolepticRecords,
  generateOrganolepticByMenu,
} from '../../services/organolepticJournal';
import ExportButton from '../../components/ExportButton';
import { exportData } from '../../utils/exportUtils';

const GROUPS = [
  'all',
  'Ясельная',
  'Младшая',
  'Средняя',
  'Старшая',
  'Подготовительная',
];

export default function OrganolepticJournalPage() {
  const [records, setRecords] = useState<OrganolepticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] =
    useState<Partial<OrganolepticRecord> | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [group, setGroup] = useState('all');
  const [responsibleSignature, setResponsibleSignature] = useState('');
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getOrganolepticRecords({ date, group });
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [date, group]);

  const handleGenerateByMenu = async () => {
    setLoading(true);
    try {
      const generated = await generateOrganolepticByMenu({ date, group });
      setRecords((prev) => [...generated, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    try {
      await clearOrganolepticRecords();
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editRecord?._id) {
        const updated = await updateOrganolepticRecord(
          editRecord._id,
          editRecord,
        );
        setRecords((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r)),
        );
      } else if (editRecord) {
        const created = await createOrganolepticRecord(editRecord);
        setRecords((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteOrganolepticRecord(id);
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    exportType: string,
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    await exportData('organoleptic-journal', exportFormat, {
      date,
      group,
      responsibleSignature,
      records,
    });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h4' gutterBottom>
        Журнал органолептической оценки качества блюд
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button
          variant='contained'
          color='secondary'
          onClick={handleGenerateByMenu}
        >
          Сгенерировать по меню
        </Button>
        <Button variant='outlined' color='error' onClick={handleClearAll}>
          Очистить
        </Button>
        <ExportButton
          exportTypes={[
            {
              value: 'organoleptic-journal',
              label: 'Журнал органолептической оценки',
            },
          ]}
          onExport={handleExport}
        />
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          Основная информация
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField
            type='date'
            label='Дата проведения оценки'
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size='small'
          />
          <FormControl size='small' sx={{ minWidth: 180 }}>
            <InputLabel>Группа</InputLabel>
            <Select
              value={group}
              label='Группа'
              onChange={(e) => setGroup(e.target.value)}
            >
              {GROUPS.map((g) => (
                <MenuItem key={g} value={g}>
                  {g === 'all' ? 'Все' : g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label='Подпись ответственного'
            value={responsibleSignature}
            onChange={(e) => setResponsibleSignature(e.target.value)}
            size='small'
          />
        </Stack>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          Оценка качества блюд и кулинарных изделий
        </Typography>
        <Table size='small' sx={{ minWidth: 900, overflowX: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Блюдо</TableCell>
              <TableCell>Группа</TableCell>
              <TableCell>Внешний вид</TableCell>
              <TableCell>Вкус</TableCell>
              <TableCell>Запах</TableCell>
              <TableCell>Решение</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  Нет данных для отображения. Нажмите "Сгенерировать по меню"
                  для добавления данных.
                </TableCell>
              </TableRow>
            )}
            {records.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.dish}</TableCell>
                <TableCell>{r.group}</TableCell>
                <TableCell>{r.appearance}</TableCell>
                <TableCell>{r.taste}</TableCell>
                <TableCell>{r.smell}</TableCell>
                <TableCell>{r.decision}</TableCell>
                <TableCell>
                  <Button
                    size='small'
                    onClick={() => {
                      setEditRecord(r);
                      setModalOpen(true);
                    }}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size='small'
                    color='error'
                    onClick={() => r._id && handleDelete(r._id)}
                  >
                    Удалить
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>
          {editRecord?._id ? 'Редактировать запись' : 'Добавить запись'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label='Блюдо'
            value={editRecord?.dish || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, dish: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Группа'
            value={editRecord?.group || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, group: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Внешний вид'
            value={editRecord?.appearance || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, appearance: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Вкус'
            value={editRecord?.taste || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, taste: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Запах'
            value={editRecord?.smell || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, smell: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
          <TextField
            label='Решение'
            value={editRecord?.decision || ''}
            onChange={(e) =>
              setEditRecord((i) => ({ ...i, decision: e.target.value }))
            }
            fullWidth
            margin='dense'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant='contained'>
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
