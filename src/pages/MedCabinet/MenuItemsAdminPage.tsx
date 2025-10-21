import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../../services/menuItems';
import { MenuItem as MenuItemType } from '../../types/menuItem';

const MEALS = ['Завтрак', 'Обед', 'Полдник', 'Ужин'];
const GROUPS = ['all', 'Ясельная', 'Младшая', 'Средняя', 'Старшая', 'Подготовительная'];

export default function MenuItemsAdminPage() {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<MenuItemType> | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getMenuItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editItem?._id) {
        const updated = await updateMenuItem(editItem._id, editItem);
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      } else if (editItem) {
        const created = await createMenuItem(editItem);
        setItems(prev => [created, ...prev]);
      }
      setModalOpen(false);
      setEditItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteMenuItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Справочник детских блюд</Typography>
      <Button variant="contained" onClick={() => { setEditItem({}); setModalOpen(true); }} sx={{ mb: 2 }}>Добавить блюдо</Button>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Table size="small" sx={{ minWidth: 900, overflowX: 'auto' }}>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Приём пищи</TableCell>
              <TableCell>Группа</TableCell>
              <TableCell>Доза витамина С (мг)</TableCell>
              <TableCell>Порция (шт/мл/г)</TableCell>
              <TableCell>Ед. изм.</TableCell>
              <TableCell>Активно</TableCell>
              <TableCell>Примечания</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">Нет блюд</TableCell>
              </TableRow>
            )}
            {items.map(i => (
              <TableRow key={i._id}>
                <TableCell>{i.name}</TableCell>
                <TableCell>{i.meal}</TableCell>
                <TableCell>{i.group}</TableCell>
                <TableCell>{i.vitaminDose}</TableCell>
                <TableCell>{i.defaultPortion}</TableCell>
                <TableCell>{i.unit}</TableCell>
                <TableCell><Switch checked={i.isActive} disabled /></TableCell>
                <TableCell>{i.notes}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => { setEditItem(i); setModalOpen(true); }}>Редактировать</Button>
                  <Button size="small" color="error" onClick={() => i._id && handleDelete(i._id)}>Удалить</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>{editItem?._id ? 'Редактировать блюдо' : 'Добавить блюдо'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Название"
            value={editItem?.name || ''}
            onChange={e => setEditItem(i => ({ ...i, name: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Приём пищи</InputLabel>
            <Select value={editItem?.meal || ''} label="Приём пищи" onChange={e => setEditItem(i => ({ ...i, meal: e.target.value }))}>
              {MEALS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Группа</InputLabel>
            <Select value={editItem?.group || 'all'} label="Группа" onChange={e => setEditItem(i => ({ ...i, group: e.target.value }))}>
              {GROUPS.map(g => <MenuItem key={g} value={g}>{g === 'all' ? 'Все' : g}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Доза витамина С (мг)"
            type="number"
            value={editItem?.vitaminDose || ''}
            onChange={e => setEditItem(i => ({ ...i, vitaminDose: Number(e.target.value) }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Порция (шт/мл/г)"
            type="number"
            value={editItem?.defaultPortion || ''}
            onChange={e => setEditItem(i => ({ ...i, defaultPortion: Number(e.target.value) }))}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Ед. изм. (шт/мл/г)"
            value={editItem?.unit || ''}
            onChange={e => setEditItem(i => ({ ...i, unit: e.target.value }))}
            fullWidth
            margin="dense"
          />
          <FormControlLabel
            control={<Switch checked={!!editItem?.isActive} onChange={e => setEditItem(i => ({ ...i, isActive: e.target.checked }))} />}
            label="Активно"
          />
          <TextField
            label="Примечания"
            value={editItem?.notes || ''}
            onChange={e => setEditItem(i => ({ ...i, notes: e.target.value }))}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
      {loading && <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%' }} />}
    </Box>
  );
}
