import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExportButton from '../../../shared/components/ExportButton';
import { exportData } from '../../../shared/utils/exportUtils';
import { getNormsData, NormsData } from '../services/productReports';
import { SANPIN_NORMS, CATEGORY_MAPPING } from '../../../shared/constants/foodNorms';

const AGE_GROUPS = [
  { value: '1-3', label: '1-3 года' },
  { value: '3-7', label: '3-7 лет' },
];

interface NormRow {
  category: string;
  norm: number;
  actual: number;
  deviation: number;
  unit: string;
  status: string;
}

const FoodNormsControlPage: React.FC = () => {
  const [rows, setRows] = useState<NormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(10);
  const [ageGroup, setAgeGroup] = useState<'1-3' | '3-7'>('3-7');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');

  const calculateReport = async () => {
    setLoading(true);
    try {
      const end = new Date(startDate);
      end.setDate(end.getDate() + days - 1);
      const endDateStr = end.toISOString().slice(0, 10);

      const data: NormsData = await getNormsData(startDate, endDateStr);

      if (!data.totalChildDays) {
        setRows([]);
        return;
      }

      // Группируем расход по категориям СанПиН
      const categorizedConsumption: Record<string, number> = {};

      data.consumption.forEach(item => {
        // Определяем категорию СанПиН через маппинг по имени продукта или его категории
        // Сначала пробуем найти точное соответствие в маппинге для продукта (если бы оно было)
        // Но сейчас у нас маппинг категорий.
        const sanpinCat = CATEGORY_MAPPING[item.category || ''] || 'Прочее';
        categorizedConsumption[sanpinCat] = (categorizedConsumption[sanpinCat] || 0) + item.totalConsumed;
      });

      // Формируем строки для таблицы
      const newRows = SANPIN_NORMS.map(norm => {
        const actualTotalGrams = categorizedConsumption[norm.category] || 0;
        // Среднее на 1 ребенка в день
        // Важно: если единица "шт" (для яиц), оставляем как есть, если "г", то в расчетах обычно все в граммах
        const actualAvg = actualTotalGrams / data.totalChildDays;

        const targetNorm = norm.norms[ageGroup];
        const deviation = targetNorm ? Math.round(((actualAvg - targetNorm) / targetNorm) * 100) : 0;

        return {
          category: norm.category,
          unit: norm.unit,
          norm: targetNorm,
          actual: Number(actualAvg.toFixed(2)),
          deviation,
          status: getStatus(targetNorm, actualAvg)
        };
      });

      setRows(newRows);
    } catch (error) {
      console.error('Ошибка при расчете норм:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateReport();
  }, [startDate, days, ageGroup]);

  const filteredRows = rows.filter((row) => {
    return !search || row.category.toLowerCase().includes(search.toLowerCase());
  });

  const handleExport = async (
    exportType: string,
    exportFormat: 'excel',
  ) => {
    await exportData('food-norms-control', exportFormat, {
      rows: filteredRows,
      note,
      startDate,
      days,
      ageGroup,
    });
  };

  function getStatus(norm: number, actual: number) {
    if (!norm) return 'В норме';
    const deviation = ((actual - norm) / norm) * 100;
    if (Math.abs(deviation) <= 10) return 'В норме';
    if (deviation > 10) return 'Превышение';
    return 'Отклонение';
  }

  const getRowColor = (status: string) => {
    switch (status) {
      case 'Превышение': return '#ffe0e0';
      case 'Отклонение': return '#fffbe0';
      default: return 'inherit';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant='h4' gutterBottom>
        Ведомость контроля норм питания (СанПиН)
      </Typography>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} alignItems="center">
          <TextField
            type='date'
            label='Начало периода'
            size='small'
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            type='number'
            label='Период (дней)'
            size='small'
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            sx={{ width: 120 }}
          />
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Возраст</InputLabel>
            <Select
              value={ageGroup}
              label='Возраст'
              onChange={(e) => setAgeGroup(e.target.value as any)}
            >
              {AGE_GROUPS.map((ag) => (
                <MenuItem key={ag.value} value={ag.value}>
                  {ag.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size='small'
            placeholder='Поиск по категориям...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <ExportButton
            exportTypes={[
              {
                value: 'food-norms-control',
                label: 'Ведомость норм питания',
              },
            ]}
            onExport={handleExport}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size='small' sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Наименование группы продуктов</TableCell>
                <TableCell align="center">Ед. изм.</TableCell>
                <TableCell align="center">Норма (на 1 реб.)</TableCell>
                <TableCell align="center">Факт (среднее)</TableCell>
                <TableCell align="center">Отклонение (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align='center' sx={{ py: 3, color: 'text.disabled' }}>
                    Нет данных за выбранный период. Убедитесь, что меню заполнено и продукты списаны.
                  </TableCell>
                </TableRow>
              )}
              {filteredRows.map((row, idx) => (
                <TableRow key={idx} sx={{ backgroundColor: getRowColor(row.status) }}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="center">{row.unit}</TableCell>
                  <TableCell align="center">{row.norm}</TableCell>
                  <TableCell align="center">{row.actual}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {row.deviation > 0 ? `+${row.deviation}` : row.deviation}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle1'>Примечание</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='Заметки к ведомости...'
        />
      </Box>

      <Box sx={{ fontSize: 13, color: 'text.secondary', p: 1, border: '1px dashed #ccc', borderRadius: 1 }}>
        <b>Справка:</b> Расчет производится как (Общий расход продукта) / (Всего дето-дней за период).
        Дето-день — это присутствие одного ребенка в течение одного дня.
        Нормы соответствуют СанПиН 2.3/2.4.3590-20.
      </Box>
    </Box>
  );
};

export default FoodNormsControlPage;
