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
import {
  productCertificateApi,
  ProductCertificate,
} from '../../services/productCertificate';
import ExportButton from '../../components/ExportButton';
import { exportData } from '../../utils/exportUtils';

const defaultForm: ProductCertificate = {
  date: '',
  product: '',
  certificateNumber: '',
  issuedBy: '',
  expiry: '',
  notes: '',
};


const ProductCertificatePage: React.FC = () => {
  const [rows, setRows] = useState<ProductCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ProductCertificate>>(defaultForm);
  const [editId, setEditId] = useState<string | undefined>();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const data = await productCertificateApi.getAll();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row?: ProductCertificate) => {
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
        await productCertificateApi.update(editId, form);
      } else {
        await productCertificateApi.create(form);
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
      await productCertificateApi.deleteItem(id);
      await fetchRows();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    exportType: string,
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    await exportData('product-certificate', exportFormat, { rows });
  };

  return (
    <>
      <Box p={3}>
        <Typography variant='h4' gutterBottom>
          Журнал регистрации сертификатов годности продуктов питания
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
              { value: 'product-certificate', label: 'Сертификаты продуктов' },
            ]}
            onExport={handleExport}
          />
        </Stack>
        <Paper sx={{ p: 2, mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Продукт</TableCell>
              <TableCell>Номер сертификата</TableCell>
              <TableCell>Кем выдан</TableCell>
              <TableCell>Срок годности</TableCell>
              <TableCell>Примечания</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.product}</TableCell>
                <TableCell>{row.certificateNumber}</TableCell>
                <TableCell>{row.issuedBy}</TableCell>
                <TableCell>{row.expiry}</TableCell>
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
                label='Номер сертификата'
                name='certificateNumber'
                value={form.certificateNumber}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label='Кем выдан'
                name='issuedBy'
                value={form.issuedBy}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label='Срок годности'
                name='expiry'
                type='date'
                value={form.expiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
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
    </>
  );
};

export default ProductCertificatePage;
