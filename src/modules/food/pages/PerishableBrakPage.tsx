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
  Autocomplete,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import {
  perishableBrakApi,
  PerishableBrak,
} from '../services/perishableBrak';
import { getProducts, Product } from '../services/products';
import ExportButton from '../../../shared/components/ExportButton';
import { exportData } from '../../../shared/utils/exportUtils';
import { formatDate } from '../../../shared/utils/format';

const defaultForm: Partial<PerishableBrak> = {
  inspectionDate: new Date().toISOString().split('T')[0],
  productName: '',
  productId: '',
  batchNumber: '',
  expirationDate: '',
  quantity: 0,
  unit: 'кг',
  reason: '',
  notes: '',
  status: 'pending',
};

const PerishableBrakPage: React.FC = () => {
  const [rows, setRows] = useState<PerishableBrak[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<PerishableBrak>>(defaultForm);
  const [editId, setEditId] = useState<string | undefined>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await perishableBrakApi.getAll();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchProducts();
  }, []);

  const handleOpen = (row?: PerishableBrak) => {
    if (row) {
      setForm({
        ...row,
        inspectionDate: row.inspectionDate ? new Date(row.inspectionDate).toISOString().split('T')[0] : '',
        expirationDate: row.expirationDate ? new Date(row.expirationDate).toISOString().split('T')[0] : '',
      });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: any }>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name as string]: value });
  };

  const handleProductChange = (_event: any, newValue: Product | null) => {
    if (newValue) {
      setForm({
        ...form,
        productId: newValue._id,
        productName: newValue.name,
        unit: newValue.unit,
      });
    } else {
      setForm({
        ...form,
        productId: '',
        productName: '',
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Partial<PerishableBrak> = {
        ...form,
        // Ensure legacy fields are filled for backward compatibility if needed by frontend
        date: form.inspectionDate as string,
        product: form.productName,
        assessment: form.status === 'reviewed' ? 'Годен' : 'Ожидает',
        expiry: form.expirationDate as string,
      };

      if (editId) {
        await perishableBrakApi.update(editId, payload);
      } else {
        await perishableBrakApi.create(payload);
      }
      await fetchRows();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    setLoading(true);
    try {
      await perishableBrakApi.deleteItem(id);
      await fetchRows();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    _exportType: string,
    _exportFormat: 'excel',
  ) => {
    await exportData('perishable-brak', _exportFormat, { rows });
  };

  return (
    <Box p={3}>
      <Typography variant='h4' gutterBottom>
        Бракераж скоропортящейся продукции и полуфабрикатов
      </Typography>
      <Stack direction='row' spacing={2} mb={2}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => handleOpen()}
          disabled={loading}
        >
          Добавить запись
        </Button>
        <ExportButton
          exportTypes={[
            { value: 'perishable-brak', label: 'Бракераж скоропортящихся' },
          ]}
          onExport={handleExport}
        />
      </Stack>
      <Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Дата инспекции</TableCell>
              <TableCell>Продукт</TableCell>
              <TableCell>Партия</TableCell>
              <TableCell>Кол-во</TableCell>
              <TableCell>Срок годности</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Инспектор</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Записи не найдены</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{formatDate(row.inspectionDate || row.date || '')}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {row.productName || row.product}
                    </Typography>
                    {row.productId && (
                      <Typography variant="caption" color="textSecondary">
                        ID: {typeof row.productId === 'object' ? row.productId.name : row.productId}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{row.batchNumber || '-'}</TableCell>
                  <TableCell>{row.quantity} {row.unit}</TableCell>
                  <TableCell>{formatDate(row.expirationDate || row.expiry || '')}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        bgcolor: row.status === 'disposed' ? 'error.light' : row.status === 'reviewed' ? 'success.light' : 'warning.light',
                        color: row.status === 'disposed' ? 'error.dark' : row.status === 'reviewed' ? 'success.dark' : 'warning.dark',
                      }}
                    >
                      {row.status === 'disposed' ? 'Утилизирован' : row.status === 'reviewed' ? 'Проверен' : 'Ожидает'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(row.inspector as any)?.fullName || 'Система'}
                  </TableCell>
                  <TableCell>
                    <Stack direction='row' spacing={1}>
                      <Button size='small' onClick={() => handleOpen(row)}>
                        Ред.
                      </Button>
                      <Button
                        size='small'
                        color='error'
                        onClick={() => handleDelete(row._id)}
                      >
                        Удал.
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>
          {editId ? 'Редактировать запись бракеража' : 'Новая запись бракеража'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction="row" spacing={2}>
              <TextField
                label='Дата инспекции'
                name='inspectionDate'
                type='date'
                value={form.inspectionDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
              <TextField
                label='Срок годности'
                name='expirationDate'
                type='date'
                value={form.expirationDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Stack>

            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.name}
              loading={productsLoading}
              value={products.find(p => p._id === form.productId) || null}
              onChange={handleProductChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Выберите продукт"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label='Номер партии'
                name='batchNumber'
                value={form.batchNumber}
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
              <FormControl fullWidth>
                <InputLabel>Ед. изм.</InputLabel>
                <Select
                  name="unit"
                  value={form.unit}
                  label="Ед. изм."
                  onChange={handleChange as any}
                >
                  <MuiMenuItem value="кг">кг</MuiMenuItem>
                  <MuiMenuItem value="г">г</MuiMenuItem>
                  <MuiMenuItem value="л">л</MuiMenuItem>
                  <MuiMenuItem value="мл">мл</MuiMenuItem>
                  <MuiMenuItem value="шт">шт</MuiMenuItem>
                  <MuiMenuItem value="упак">упак</MuiMenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label='Причина брака / Состояние'
              name='reason'
              value={form.reason}
              onChange={handleChange}
              placeholder="Например: Повреждена упаковка, Органолептическая проверка пройдена"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                name="status"
                value={form.status}
                label="Статус"
                onChange={handleChange as any}
              >
                <MuiMenuItem value="pending">Ожидает проверки</MuiMenuItem>
                <MuiMenuItem value="reviewed">Проверено (Годен)</MuiMenuItem>
                <MuiMenuItem value="disposed">Утилизировано (Брак)</MuiMenuItem>
              </Select>
            </FormControl>

            <TextField
              label='Примечания'
              name='notes'
              value={form.notes}
              onChange={handleChange}
              multiline
              rows={2}
              fullWidth
            />

            {form.status === 'disposed' && (
              <TextField
                label='Метод утилизации'
                name='disposalMethod'
                value={form.disposalMethod}
                onChange={handleChange}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSave} variant='contained' disabled={loading || !form.productName}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerishableBrakPage;
