import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { foodStaffHealthApi, FoodStaffHealth } from '../../services/foodStaffHealth';

const defaultForm: FoodStaffHealth = {
  date: '',
  staffName: '',
  healthStatus: '',
  notes: '',
};

const FoodStaffHealthPage: React.FC = () => {
  const [rows, setRows] = useState<FoodStaffHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FoodStaffHealth>(defaultForm);
  const [editId, setEditId] = useState<string | undefined>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await foodStaffHealthApi.getAll();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row?: FoodStaffHealth) => {
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
        await foodStaffHealthApi.update(editId, form);
      } else {
        await foodStaffHealthApi.create(form);
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
      await foodStaffHealthApi.deleteItem(id);
      await fetchRows();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Журнал регистрации состояния здоровья работников пищеблока
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>
          Добавить запись
        </Button>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>ФИО работника</TableCell>
              <TableCell>Состояние здоровья</TableCell>
              <TableCell>Примечания</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.staffName}</TableCell>
                <TableCell>{row.healthStatus}</TableCell>
                <TableCell>{row.notes}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => handleOpen(row)}>Редактировать</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(row._id)}>Удалить</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редактировать запись' : 'Добавить запись'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Дата" name="date" type="date" value={form.date} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="ФИО работника" name="staffName" value={form.staffName} onChange={handleChange} fullWidth />
            <TextField label="Состояние здоровья" name="healthStatus" value={form.healthStatus} onChange={handleChange} fullWidth />
            <TextField label="Примечания" name="notes" value={form.notes} onChange={handleChange} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodStaffHealthPage;
