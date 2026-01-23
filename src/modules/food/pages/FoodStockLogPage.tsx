import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { foodStockLogApi, FoodStockLog } from '../services/foodStockLog';
import ExportButton from '../../../shared/components/ExportButton';
import { exportData } from '../../../shared/utils/exportUtils';

const defaultForm: FoodStockLog = {
  date: '',
  product: '',
  quantity: 0,
  unit: '',
  responsible: '',
  notes: '',
};


const FoodStockLogPage: React.FC = () => {
  const [rows, setRows] = useState<FoodStockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<FoodStockLog>>(defaultForm);
  const [editId, setEditId] = useState<string | undefined>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await foodStockLogApi.getAll();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row?: FoodStockLog) => {
    if (row) {
      setForm(row);
      setEditId(row._id);
    } else {
      setForm(defaultForm);
      setEditId(undefined);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(defaultForm);
    setEditId(undefined);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editId) {
        await foodStockLogApi.update(editId, form);
      } else {
        await foodStockLogApi.create(form);
      }
      await fetchRows();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await foodStockLogApi.deleteItem(id);
      await fetchRows();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    exportType: string,
    exportFormat: 'excel',
  ) => {
    await exportData('food-stock-log', exportFormat, { rows });
  };

  return (
    <Box p={3}>
      <Typography variant='h4' gutterBottom>
        Журнал учета приходов, расходов и остатков ежедневных продуктов
      </Typography>
      <Stack direction='row' spacing={2} mb={2}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => handleOpen()}
        >
          Добавить запись
        </Button>
        <ExportButton
          exportTypes={[
            { value: 'food-stock-log', label: 'Журнал учета продуктов' },
          ]}
          onExport={handleExport}
        />
      </Stack>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Продукт</TableCell>
              <TableCell>Количество</TableCell>
              <TableCell>Ед. изм.</TableCell>
              <TableCell>Ответственный</TableCell>
              <TableCell>Примечания</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.product}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>{row.responsible}</TableCell>
                <TableCell>{row.notes}</TableCell>
                <TableCell>
                  <Stack direction='row' spacing={1}>
                    <Button size='small' onClick={() => handleOpen(row)}>
                      Редактировать
                    </Button>
                    <Button
                      size='small'
                      color='error'
                      onClick={() => handleDelete(row._id)}
                    >
                      Удалить
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editId ? 'Редактировать запись' : 'Добавить запись'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label='Дата'
              name='date'
              type='date'
              value={form.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label='Продукт'
              name='product'
              value={form.product}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label='Количество'
              name='quantity'
              type='number'
              value={form.quantity}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label='Ед. изм.'
              name='unit'
              value={form.unit}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label='Ответственный'
              name='responsible'
              value={form.responsible}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label='Примечания'
              name='notes'
              value={form.notes}
              onChange={handleChange}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSave} variant='contained' disabled={loading}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodStockLogPage;
