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
} from '@mui/material';
import { getUsers } from '../../services/users';
import childrenApi from '../../services/children';
import { User } from '../../types/common';
import {
  getHelminthRecords,
  createHelminthRecord,
  deleteHelminthRecord,
} from '../../services/helminthJournal';
import { HelminthRecord } from '../../types/helminth';
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
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) =>
  (2020 + i).toString(),
);

// Используем HelminthRecord из types/helminth.ts (импортирован через сервис)
// Локальные UI-поля (fio, birthdate, address, month, year, examType) теперь опциональные


export default function HelminthJournal() {
  const [records, setRecords] = useState<HelminthRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<HelminthRecord>>({});
  const [month, setMonth] = useState('all');
  const [year, setYear] = useState('all');
  const [examType, setExamType] = useState('all');
  const [result, setResult] = useState('all');

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      childrenApi.getAll().then((children) => {
        setUsers(children as any);
      }),
      getHelminthRecords().then(setRecords),
    ]).finally(() => setLoading(false));
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
    if (
      !newRecord.childId ||
      !newRecord.fio ||
      !newRecord.month ||
      !newRecord.year ||
      !newRecord.examType ||
      !newRecord.result
    )
      return;
    setLoading(true);
    try {
      // Generate date from month and year
      const monthIndex = MONTHS.indexOf(newRecord.month);
      const dateObj = new Date(parseInt(newRecord.year), monthIndex, 1);

      const created = await createHelminthRecord({
        ...newRecord,
        date: dateObj.toISOString(),
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
      await deleteHelminthRecord(id);
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
                ...filteredRecords.map(
                  (r, idx) =>
                    new DocxTableRow({
                      children: [
                        String(idx + 1),
                        r.fio || '',
                        r.birthdate || '',
                        r.address || '',
                        r.month || '',
                        r.year || '',
                        r.examType === 'primary'
                          ? 'При поступлении'
                          : r.examType === 'annual'
                            ? 'Ежегодное'
                            : '',
                        r.result === 'positive'
                          ? 'Положительно'
                          : 'Отрицательно',
                        r.notes || '',
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
      saveAs(blob, 'Журнал_гельминты.docx');
    });
  };


  const handleChildSelect = (id: string) => {
    const child = users.find((u) => u.id === id || u._id === id);
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
    setMonth('all');
    setYear('all');
    setExamType('all');
    setResult('all');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h5' gutterBottom>
        Журнал регистрации лиц, обследованных на гельминты
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Button variant='contained' onClick={() => setModalOpen(true)}>
          Новая запись
        </Button>
        <Button variant='outlined' onClick={handleExport}>
          Экспорт
        </Button>
        <FormControl size='small' sx={{ minWidth: 140 }}>
          <InputLabel>Месяц</InputLabel>
          <Select
            value={month}
            label='Месяц'
            onChange={(e) => setMonth(e.target.value)}
          >
            <MenuItem value='all'>Все месяцы</MenuItem>
            {MONTHS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel>Год</InputLabel>
          <Select
            value={year}
            label='Год'
            onChange={(e) => setYear(e.target.value)}
          >
            <MenuItem value='all'>Все годы</MenuItem>
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 180 }}>
          <InputLabel>Тип обследования</InputLabel>
          <Select
            value={examType}
            label='Тип обследования'
            onChange={(e) => setExamType(e.target.value)}
          >
            <MenuItem value='all'>Все</MenuItem>
            <MenuItem value='primary'>При поступлении</MenuItem>
            <MenuItem value='annual'>Ежегодное</MenuItem>
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Результат</InputLabel>
          <Select
            value={result}
            label='Результат'
            onChange={(e) => setResult(e.target.value)}
          >
            <MenuItem value='all'>Все</MenuItem>
            <MenuItem value='positive'>Положительно</MenuItem>
            <MenuItem value='negative'>Отрицательно</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={handleClearFilters}>Очистить фильтры</Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Всего записей: {stats.total}</Typography>
        <Typography>Положительных: {stats.positive}</Typography>
        <Typography>Отрицательных: {stats.negative}</Typography>
      </Paper>
      <Table size='small' sx={{ minWidth: 900, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            <TableCell>№</TableCell>
            <TableCell>ФИО</TableCell>
            <TableCell>Дата рождения</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell>Месяц</TableCell>
            <TableCell>Год</TableCell>
            <TableCell>Тип обследования</TableCell>
            <TableCell>Результат</TableCell>
            <TableCell>Примечания</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredRecords.map((r, idx) => {
            const childInfo = r.childId && typeof r.childId === 'object' ? r.childId as any : null;
            const fio = r.fio || childInfo?.fullName || '';
            const birthdate = r.birthdate || (childInfo?.birthday ? new Date(childInfo.birthday).toLocaleDateString('ru-RU') : '');
            const address = r.address || childInfo?.address || '';
            return (
              <TableRow key={r.id || r._id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{fio}</TableCell>
                <TableCell>{birthdate}</TableCell>
                <TableCell>{address}</TableCell>
                <TableCell>{r.month}</TableCell>
                <TableCell>{r.year}</TableCell>
                <TableCell>
                  {r.examType === 'primary' ? 'При поступлении' : 'Ежегодное'}
                </TableCell>
                <TableCell>
                  {r.result === 'positive' ? 'Положительно' : 'Отрицательно'}
                </TableCell>
                <TableCell>{r.notes}</TableCell>
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
          <FormControl fullWidth margin='dense'>
            <InputLabel>Месяц</InputLabel>
            <Select
              value={newRecord.month || ''}
              label='Месяц'
              onChange={(e) =>
                setNewRecord((r) => ({ ...r, month: e.target.value }))
              }
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense'>
            <InputLabel>Год</InputLabel>
            <Select
              value={newRecord.year || CURRENT_YEAR.toString()}
              label='Год'
              onChange={(e) =>
                setNewRecord((r) => ({ ...r, year: e.target.value }))
              }
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin='dense'>
            <InputLabel>Тип обследования</InputLabel>
            <Select
              value={newRecord.examType || ''}
              label='Тип обследования'
              onChange={(e) =>
                setNewRecord((r) => ({
                  ...r,
                  examType: e.target.value as 'primary' | 'annual',
                }))
              }
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
              onChange={(e) =>
                setNewRecord((r) => ({
                  ...r,
                  result: e.target.value as 'positive' | 'negative',
                }))
              }
            >
              <MenuItem value='positive'>Положительно</MenuItem>
              <MenuItem value='negative'>Отрицательно</MenuItem>
            </Select>
          </FormControl>
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
