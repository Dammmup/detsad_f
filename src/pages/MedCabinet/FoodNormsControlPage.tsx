

import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody, Stack, TextField, Select, MenuItem, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { exportFoodNormsToDocx } from '../../services/foodNormsControl';


interface FoodNormsRow {
  product: string;
  norm: number;
  actual: number;
  deviation: number;
  status?: string;
}

const initialRows: FoodNormsRow[] = [];
const GROUPS = ['Без группы', 'Ясельная', 'Младшая', 'Средняя', 'Старшая', 'Подготовительная'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const STATUSES = ['Все статусы', 'В норме', 'Отклонение', 'Превышение'];


export default function FoodNormsControlPage() {
  const [rows, setRows] = useState<FoodNormsRow[]>(initialRows);
  const [note, setNote] = useState('');
  const [month, setMonth] = useState('Сентябрь');
  const [year, setYear] = useState('2025');
  const [group, setGroup] = useState('Без группы');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Все статусы');

  // Фильтрация по поиску и статусу
  const filteredRows = rows.filter(row =>
    (search === '' || row.product.toLowerCase().includes(search.toLowerCase())) &&
    (status === 'Все статусы' || row.status === status)
  );

  // Автозаполнение по меню (заглушка)
  const handleAutoFill = () => {
    setRows([
      { product: 'Молоко', norm: 200, actual: 190, deviation: -5, status: 'В норме' },
      { product: 'Хлеб', norm: 50, actual: 60, deviation: 20, status: 'Превышение' },
      { product: 'Мясо', norm: 80, actual: 70, deviation: -12, status: 'Отклонение' },
    ]);
  };

  const handleAdd = () => {
    setRows(prev => [...prev, { product: '', norm: 0, actual: 0, deviation: 0, status: 'В норме' }]);
  };

  // Экспорт в docx
  const handleExport = () => {
    exportFoodNormsToDocx({ rows: filteredRows, note, month, year, group });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Ведомость контроля за выполнением норм пищевой продукции (Форма 4)</Typography>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <Select size="small" value={month} onChange={e => setMonth(e.target.value)} sx={{ width: 120 }}>
            {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
          <TextField label="Год" size="small" value={year} onChange={e => setYear(e.target.value)} sx={{ width: 100 }} />
          <Select size="small" value={group} onChange={e => setGroup(e.target.value)} sx={{ minWidth: 180 }}>
            {GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </Select>
          <TextField
            size="small"
            placeholder="Поиск по продуктам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small"><SearchIcon /></IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <Select size="small" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
          <Button variant="contained" size="small" onClick={handleAutoFill}>Генерировать по меню</Button>
          <Button variant="contained" size="small" onClick={handleExport}>Экспорт в Word</Button>
        </Stack>
        <Table size="small" sx={{ minWidth: 800, overflowX: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>№</TableCell>
              <TableCell>Наименование пищевой продукции</TableCell>
              <TableCell>Норма (г/мл брутто на 1 ребенка в день)</TableCell>
              <TableCell>Фактически</TableCell>
              <TableCell>Отклонение от нормы (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled' }}>
                  Продукты отсутствуют. Добавьте продукты вручную.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <TextField size="small" value={row.product} onChange={e => {
                    const v = e.target.value;
                    setRows(prev => prev.map((r, i) => i === idx ? { ...r, product: v } : r));
                  }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" value={row.norm} onChange={e => {
                    const v = Number(e.target.value);
                    setRows(prev => prev.map((r, i) => i === idx ? { ...r, norm: v } : r));
                  }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number" value={row.actual} onChange={e => {
                    const v = Number(e.target.value);
                    setRows(prev => prev.map((r, i) => i === idx ? { ...r, actual: v, deviation: r.norm ? Math.round(((v - r.norm) / r.norm) * 100) : 0, status: getStatus(r.norm, v) } : r));
                  }} />
                </TableCell>
                <TableCell>{row.deviation}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" size="small" onClick={handleAdd}>Добавить продукт</Button>
        </Box>
      </Paper>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Примечание</Typography>
        <TextField fullWidth multiline minRows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Дополнительные заметки к ведомости..." />
      </Box>
      <Box sx={{ fontSize: 13, color: 'text.secondary' }}>
        <b>Обозначения:</b><br />
        <span style={{ background: '#e0ffe0', padding: '0 4px' }}>Норма (отклонение ≤ 10%)</span> &nbsp;
        <span style={{ background: '#fffbe0', padding: '0 4px' }}>Отклонение (10% &lt; отклонение ≤ 20%)</span> &nbsp;
        <span style={{ background: '#ffe0e0', padding: '0 4px' }}>Превышение (отклонение &gt; 20%)</span> &nbsp;
        <br />Единицы измерения: г/мл брутто на 1 ребенка
      </Box>
    </Box>
  );

  function getStatus(norm: number, actual: number) {
    if (!norm) return 'В норме';
    const deviation = Math.abs(((actual - norm) / norm) * 100);
    if (deviation <= 10) return 'В норме';
    if (deviation <= 20) return 'Отклонение';
    return 'Превышение';
  }
}
