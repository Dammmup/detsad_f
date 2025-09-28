import React from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button, Stack } from '@mui/material';
import { MedJournalConfig } from './medJournals.config';

interface Props {
  config: MedJournalConfig;
}

export const MedJournalTable=({ config }: Props)=> {
  const [rows, setRows] = React.useState<any[]>([]);

  // Добавить пустую строку для ввода
  const handleAdd = () => {
    setRows(prev => [...prev, {}]);
  };

  // Заглушка экспорта: просто выводит alert (реализация — далее)
  const handleExport = () => {
    alert(`Экспорт журнала "${config.title}" в Word (docx) — демо`);
    // Здесь будет логика экспорта в docx/xlsx/pdf
  };

  return (
    <Paper sx={{ p: { xs: 1, md: 2 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} mb={1}>
        <Box>
          <Typography variant="h6" gutterBottom>{config.title}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>{config.description}</Typography>
        </Box>
        <Button variant="contained" size="small" onClick={handleExport} sx={{ minWidth: 140 }}>
          Экспорт в Word
        </Button>
      </Stack>
      <Table size="small" sx={{ minWidth: 600, overflowX: 'auto' }}>
        <TableHead>
          <TableRow>
            {config.fields.map(f => (
              <TableCell key={f.key}>{f.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={config.fields.length} align="center" sx={{ color: 'text.disabled' }}>
                Нет записей
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              {config.fields.map(f => (
                <TableCell key={f.key}>{row[f.key] || ''}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" onClick={handleAdd}>Добавить запись</Button>
      </Box>
    </Paper>
  );
}
