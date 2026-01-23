import React, { useState, useMemo } from 'react';
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
  Avatar,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import childrenApi from '../../children/services/children';
import { Child } from '../../../shared/types/common';
import {
  getHelminthRecords,
  createHelminthRecord,
  deleteHelminthRecord,
} from '../services/helminthJournal';
import { HelminthRecord } from '../../../shared/types/helminth';
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

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2018 }, (_, i) =>
  (2019 + i).toString(),
);

export default function HelminthJournal() {
  const [records, setRecords] = useState<HelminthRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<HelminthRecord>>({
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR.toString(),
    examType: 'primary',
    result: 'negative'
  });
  const [month, setMonth] = useState('all');
  const [year, setYear] = useState('all');
  const [examType, setExamType] = useState('all');
  const [result, setResult] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [childrenData, recordsData] = await Promise.all([
        childrenApi.getAll(),
        getHelminthRecords(),
      ]);
      setChildren(childrenData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    if (month !== 'all') filtered = filtered.filter((r) => r.month === month);
    if (year !== 'all') filtered = filtered.filter((r) => r.year === year);
    if (examType !== 'all')
      filtered = filtered.filter((r) => r.examType === examType);
    if (result !== 'all')
      filtered = filtered.filter((r) => r.result === result);
    return filtered;
  }, [records, month, year, examType, result]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const positive = filteredRecords.filter(
      (r) => r.result === 'positive',
    ).length;
    const negative = filteredRecords.filter(
      (r) => r.result === 'negative',
    ).length;
    return { total, positive, negative };
  }, [filteredRecords]);

  const handleAdd = async () => {
    try {
      if (
        !newRecord.childId ||
        !newRecord.month ||
        !newRecord.year ||
        !newRecord.examType ||
        !newRecord.result
      ) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      setLoading(true);
      const monthIndex = MONTHS.indexOf(newRecord.month);
      const dateObj = new Date(parseInt(newRecord.year), monthIndex, 1);

      const requestData = {
        childId: newRecord.childId,
        date: dateObj.toISOString(),
        month: newRecord.month,
        year: newRecord.year,
        examType: newRecord.examType,
        result: newRecord.result,
        notes: newRecord.notes || '',
      };

      const created = await createHelminthRecord(requestData as any);
      // Refresh to get populated data or just add to list
      setRecords((prev) => [created, ...prev]);
      setModalOpen(false);
      setNewRecord({
        month: MONTHS[new Date().getMonth()],
        year: CURRENT_YEAR.toString(),
        examType: 'primary',
        result: 'negative'
      });
    } catch (error: any) {
      console.error('Error creating record:', error);
      alert('Ошибка при создании записи: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    setLoading(true);
    try {
      await deleteHelminthRecord(id);
      setRecords((prev) => prev.filter((r) => (r.id || r._id) !== id));
    } catch (error: any) {
      alert('Ошибка при удалении: ' + error.message);
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
              text: 'Журнал регистрации лиц, обследованных на гельминты',
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
                    'Месяц',
                    'Год',
                    'Тип обследования',
                    'Результат',
                    'Примечания',
                  ].map(
                    (h) => new DocxTableCell({ children: [new Paragraph(h)] }),
                  ),
                }),
                ...filteredRecords.map((r, idx) => {
                  const childInfo = r.childId && typeof r.childId === 'object' ? r.childId as any : null;
                  return new DocxTableRow({
                    children: [
                      String(idx + 1),
                      childInfo?.fullName || r.fio || '',
                      childInfo?.birthday ? new Date(childInfo.birthday).toLocaleDateString('ru-RU') : r.birthdate || '',
                      childInfo?.address || r.address || '',
                      r.month || '',
                      r.year || '',
                      r.examType === 'primary' ? 'При поступлении' : 'Ежегодное',
                      r.result === 'positive' ? 'Положительно' : 'Отрицательно',
                      r.notes || '',
                    ].map(
                      (val) =>
                        new DocxTableCell({ children: [new Paragraph(val)] }),
                    ),
                  });
                }),
              ],
            }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, 'Журнал_гельминты.docx');
    });
  };

  const handleClearFilters = () => {
    setMonth('all');
    setYear('all');
    setExamType('all');
    setResult('all');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Журнал регистрации лиц, обследованных на гельминты
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <Button variant='contained' onClick={() => setModalOpen(true)} startIcon={<Person />}>
          Новая запись
        </Button>
        <Button variant='outlined' onClick={handleExport}>
          Экспорт
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <FormControl size='small' sx={{ minWidth: 140 }}>
          <InputLabel>Месяц</InputLabel>
          <Select value={month} label='Месяц' onChange={(e) => setMonth(e.target.value)}>
            <MenuItem value='all'>Все месяцы</MenuItem>
            {MONTHS.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 100 }}>
          <InputLabel>Год</InputLabel>
          <Select value={year} label='Год' onChange={(e) => setYear(e.target.value)}>
            <MenuItem value='all'>Все годы</MenuItem>
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button size="small" onClick={handleClearFilters}>Очистить</Button>
      </Stack>

      <Stack direction="row" spacing={3} mb={3}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography color="text.secondary" variant="caption">ВСЕГО</Typography>
          <Typography variant="h6">{stats.total}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: 'error.50' }}>
          <Typography color="error" variant="caption">ПОЛОЖИТЕЛЬНО</Typography>
          <Typography variant="h6" color="error">{stats.positive}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: 'success.50' }}>
          <Typography color="success.main" variant="caption">ОТРИЦАТЕЛЬНО</Typography>
          <Typography variant="h6" color="success.main">{stats.negative}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>№</TableCell>
                <TableCell>Ребенок</TableCell>
                <TableCell>Дата рождения</TableCell>
                <TableCell>Адрес</TableCell>
                <TableCell>Период</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Результат</TableCell>
                <TableCell>Примечания</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((r, idx) => {
                const childInfo = r.childId && typeof r.childId === 'object' ? r.childId as any : null;
                const fio = childInfo?.fullName || r.fio || '—';
                const birthdate = childInfo?.birthday ? new Date(childInfo.birthday).toLocaleDateString('ru-RU') : r.birthdate || '—';
                const address = childInfo?.address || r.address || '—';

                return (
                  <TableRow key={r.id || r._id} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>{fio[0]}</Avatar>
                        <Typography variant="body2">{fio}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{birthdate}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {address}
                    </TableCell>
                    <TableCell>{r.month} {r.year}</TableCell>
                    <TableCell>
                      {r.examType === 'primary' ? 'При поступл.' : 'Ежегодное'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{
                        color: r.result === 'positive' ? 'error.main' : 'success.main',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}>
                        {r.result === 'positive' ? 'ПОЛОЖИТ.' : 'ОТРИЦАТ.'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.notes}</TableCell>
                    <TableCell align="right">
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
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">Нет записей за выбранный период</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавление в журнал гельминтов</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth margin='dense'>
            <InputLabel>Ребенок</InputLabel>
            <Select
              value={newRecord.childId || ''}
              label="Ребенок"
              onChange={(e) => setNewRecord(prev => ({ ...prev, childId: e.target.value as string }))}
            >
              <MenuItem value=''><em>Выберите ребенка...</em></MenuItem>
              {children.map((child) => (
                <MenuItem key={child.id || child._id} value={child.id || child._id}>
                  {child.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth margin='dense'>
              <InputLabel>Месяц</InputLabel>
              <Select
                value={newRecord.month || ''}
                label='Месяц'
                onChange={(e) => setNewRecord((r) => ({ ...r, month: e.target.value }))}
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin='dense'>
              <InputLabel>Год</InputLabel>
              <Select
                value={newRecord.year || ''}
                label='Год'
                onChange={(e) => setNewRecord((r) => ({ ...r, year: e.target.value }))}
              >
                {YEARS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth margin='dense'>
              <InputLabel>Тип обследования</InputLabel>
              <Select
                value={newRecord.examType || ''}
                label='Тип обследования'
                onChange={(e) => setNewRecord((r) => ({ ...r, examType: e.target.value as 'primary' | 'annual' }))}
              >
                <MenuItem value='primary'>При поступлении</MenuItem>
                <MenuItem value='annual'>Ежегодное</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin='dense'>
              <InputLabel>Результат</InputLabel>
              <Select
                value={newRecord.result || ''}
                label='Результат'
                onChange={(e) => setNewRecord((r) => ({ ...r, result: e.target.value as 'positive' | 'negative' }))}
              >
                <MenuItem value='positive'>Положительно</MenuItem>
                <MenuItem value='negative'>Отрицательно</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label='Примечания'
            value={newRecord.notes || ''}
            onChange={(e) => setNewRecord((r) => ({ ...r, notes: e.target.value }))}
            fullWidth
            margin='dense'
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleAdd} variant='contained' disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', zIndex: 9999 }} />
      )}
    </Box>
  );
}
