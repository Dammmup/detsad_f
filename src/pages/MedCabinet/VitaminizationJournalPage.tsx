import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { Document, Packer, Paragraph, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell } from 'docx';
import { saveAs } from 'file-saver';
import { VitaminizationRecord } from '../../types/vitaminization';
import {
  getVitaminizationRecords,
  createVitaminizationRecord,
  updateVitaminizationRecord,
  deleteVitaminizationRecord,
  clearVitaminizationRecords
} from '../../services/vitaminizationJournal';
import { generateVitaminizationByMenu } from '../../services/vitaminizationGenerate';

const GROUPS = ['Ясельная', 'Младшая', 'Средняя', 'Старшая', 'Подготовительная'];
const MEALS = ['Завтрак', 'Обед', 'Полдник', 'Ужин'];
const STATUS = ['Проведено', 'Не проведено'];

export default function VitaminizationJournalPage() {
  const [records, setRecords] = useState<VitaminizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<VitaminizationRecord>>({});
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', group: '', meal: '', status: '', dish: '' });

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getVitaminizationRecords(filters);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newRecord.date || !newRecord.group || !newRecord.meal || !newRecord.dish || !newRecord.dose || !newRecord.portions || !newRecord.nurse || !newRecord.status) return;
    setLoading(true);
    try {
      const created = await createVitaminizationRecord(newRecord);
      setRecords(prev => [created, ...prev]);
      setModalOpen(false);
      setNewRecord({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteVitaminizationRecord(id);
      setRecords(prev => prev.filter(r => r._id !== id));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    try {
      await clearVitaminizationRecords();
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };


  // Генерация по меню
  const handleGenerateByMenu = async () => {
    setLoading(true);
    try {
      const generated = await generateVitaminizationByMenu({ date: filters.dateFrom || new Date().toISOString(), group: filters.group });
      setRecords(prev => [...generated, ...prev]);
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
            new Paragraph({ text: 'Журнал витаминизации готовых блюд', heading: HeadingLevel.HEADING_1 }),
            new DocxTable({
              rows: [
                new DocxTableRow({
                  children: [
                    'Дата и время', 'Группа', 'Приём пищи', 'Блюдо/Напиток', 'Доза/порц (мг)', 'Порции (шт)', 'Медсестра', 'Статус', 'Примечания'
                  ].map(h => new DocxTableCell({ children: [new Paragraph(h)] })),
                }),
                ...records.map(r => new DocxTableRow({
                  children: [
                    r.date ? new Date(r.date).toLocaleString() : '',
                    r.group,
                    r.meal,
                    r.dish,
                    r.dose?.toString() ?? '',
                    r.portions?.toString() ?? '',
                    r.nurse,
                    r.status,
                    r.notes || ''
                  ].map(val => new DocxTableCell({ children: [new Paragraph(val)] })),
                })),
              ],
            }),
          ],
        },
      ],
    });
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'Журнал_витаминизации.docx');
    });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Журнал витаминизации готовых блюд</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
  <Button variant="contained" color="secondary" onClick={handleGenerateByMenu}>Сгенерировать по меню</Button>
  <Button variant="contained" onClick={() => setModalOpen(true)}>Добавить вручную</Button>
  <Button variant="outlined" onClick={handleExport}>Экспорт</Button>
  <Button variant="outlined" color="error" onClick={handleClearAll}>Очистить всё</Button>
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField type="date" label="От даты" InputLabelProps={{ shrink: true }} value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} size="small" />
          <TextField type="date" label="До даты" InputLabelProps={{ shrink: true }} value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} size="small" />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Группа</InputLabel>
            <Select value={filters.group} label="Группа" onChange={e => setFilters(f => ({ ...f, group: e.target.value }))}>
              <MenuItem value="">Все группы</MenuItem>
              {GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Приём пищи</InputLabel>
            <Select value={filters.meal} label="Приём пищи" onChange={e => setFilters(f => ({ ...f, meal: e.target.value }))}>
              <MenuItem value="">Все</MenuItem>
              {MEALS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Статус</InputLabel>
            <Select value={filters.status} label="Статус" onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <MenuItem value="">Все</MenuItem>
              {STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Поиск по блюду" value={filters.dish} onChange={e => setFilters(f => ({ ...f, dish: e.target.value }))} size="small" />
        </Stack>
        <Stack direction="row" spacing={1} mb={2}>
          <Button size="small">Сегодня</Button>
          <Button size="small">За неделю</Button>
          <Button size="small">За месяц</Button>
        </Stack>
        <Table size="small" sx={{ minWidth: 900, overflowX: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Дата и время</TableCell>
              <TableCell>Группа</TableCell>
              <TableCell>Приём пищи</TableCell>
              <TableCell>Блюдо/Напиток</TableCell>
              <TableCell>Доза/порц (мг)</TableCell>
              <TableCell>Порции (шт)</TableCell>
              <TableCell>Медсестра</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">Записи отсутствуют. Используйте кнопку "Сгенерировать по меню" для автоматического создания записей.</TableCell>
              </TableRow>
            )}
            {records.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.date && new Date(r.date).toLocaleString()}</TableCell>
                <TableCell>{r.group}</TableCell>
                <TableCell>{r.meal}</TableCell>
                <TableCell>{r.dish}</TableCell>
                <TableCell>{r.dose}</TableCell>
                <TableCell>{r.portions}</TableCell>
                <TableCell>{r.nurse}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>
                  <Button color="error" size="small" onClick={() => r._id && handleDelete(r._id)}>Удалить</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>Добавить запись</DialogTitle>
        <DialogContent>
          <TextField
            type="datetime-local"
            label="Дата и время"
            InputLabelProps={{ shrink: true }}
            value={newRecord.date || ''}
            onChange={e => setNewRecord(r => ({ ...r, date: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Группа</InputLabel>
            <Select value={newRecord.group || ''} label="Группа" onChange={e => setNewRecord(r => ({ ...r, group: e.target.value }))}>
              {GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Приём пищи</InputLabel>
            <Select value={newRecord.meal || ''} label="Приём пищи" onChange={e => setNewRecord(r => ({ ...r, meal: e.target.value }))}>
              {MEALS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Блюдо/Напиток"
            value={newRecord.dish || ''}
            onChange={e => setNewRecord(r => ({ ...r, dish: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Доза/порц (мг)"
            type="number"
            value={newRecord.dose || ''}
            onChange={e => setNewRecord(r => ({ ...r, dose: Number(e.target.value) }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Порции (шт)"
            type="number"
            value={newRecord.portions || ''}
            onChange={e => setNewRecord(r => ({ ...r, portions: Number(e.target.value) }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Медсестра"
            value={newRecord.nurse || ''}
            onChange={e => setNewRecord(r => ({ ...r, nurse: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Статус</InputLabel>
            <Select value={newRecord.status || ''} label="Статус" onChange={e => setNewRecord(r => ({ ...r, status: e.target.value }))}>
              {STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Примечания"
            value={newRecord.notes || ''}
            onChange={e => setNewRecord(r => ({ ...r, notes: e.target.value }))}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleAdd} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
      {loading && <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%' }} />}
      <Box mt={4}>
        <Typography variant="h6" color="primary" gutterBottom>Требования СанПин РК к нормам витаминизации аскорбиновой кислотой</Typography>
        <Paper sx={{ p: 2 }}>
          <Typography gutterBottom>
            <b>Суточные нормы витамина С по возрастам:</b><br/>
            1-3 года (ясельная группа): 30-40 мг/сутки<br/>
            3-4 года (младшая группа): 45 мг/сутки<br/>
            4-5 лет (средняя группа): 50 мг/сутки<br/>
            5-6 лет (старшая группа): 60 мг/сутки<br/>
            6-7 лет (подготовительная): 70 мг/сутки
          </Typography>
          <Typography gutterBottom>
            <b>Требования к витаминизации:</b>
            <ul>
              <li>Витаминизация проводится в третьих блюдах и напитках</li>
              <li>Температура готового блюда не должна превышать 50°C</li>
              <li>Витаминизация проводится непосредственно перед раздачей</li>
              <li>Обязательное ведение журнала витаминизации</li>
              <li>Контроль медицинского персонала за процессом</li>
              <li>Использование только разрешённых препаратов витамина С</li>
            </ul>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
