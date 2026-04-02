import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Avatar,
  Box,
} from '@mui/material';
import { Group, User } from '../../../shared/types/common';
import { useAuth } from '../../../app/context/AuthContext';
import { useChildren } from '../../../app/context/ChildrenContext';
import { useGroups } from '../../../app/context/GroupsContext';

interface ChildrenModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  child?: Partial<User> | null;
}

const defaultForm: Omit<Partial<User>, 'role'> & { paymentAmount?: number } = {
  fullName: '',
  birthday: '',
  parentPhone: '',
  notes: '',
  iin: '',
  groupId: '',
  parentName: '',
  active: true,
  phone: '',
  photo: '',
  paymentAmount: 0,
};

const ChildrenModal: React.FC<ChildrenModalProps> = ({
  open,
  onClose,
  onSaved,
  child,
}) => {
  const { user: currentUser } = useAuth();
  const { createChild, updateChild } = useChildren();
  const { groups, fetchGroups } = useGroups();
  const [form, setForm] = useState<Partial<User> & { paymentAmount?: number }>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchGroups();
      if (child) {
        setForm({
          ...defaultForm,
          ...child,
          fullName: child.fullName || '',
          phone: child.phone || '',
          iin: child.iin || '',
          photo: child.photo || '',
          groupId:
            typeof child.groupId === 'object'
              ? (child.groupId as Group).id || (child.groupId as string)
              : child.groupId || '',
          parentName: child.parentName || '',
          parentPhone: child.parentPhone || '',
          birthday: child.birthday || '',
          notes: child.notes || '',
          paymentAmount: (child as any).paymentAmount || 0,
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [open, child]);


  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setForm({ ...form, [name]: value });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setForm({ ...form, photo: reader.result as string });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const childData: any = {
        fullName: form.fullName || '',
        phone: form.parentPhone || '',
        parentPhone: form.parentPhone || '',
        birthday: form.birthday || '',
        iin: form.iin || '',
        photo: form.photo || '',
        groupId: form.groupId || '',
        parentName: form.parentName || '',
        notes: form.notes || '',
        active: form.active !== false,
        paymentAmount: form.paymentAmount || 40000,
      };

      if (child && child.id) {
        await updateChild(child.id, childData);
      } else {
        await createChild(childData);
      }

      onSaved();
      handleClose();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(defaultForm);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1.5rem',
        }}
      >
        {child ? '✏️ Редактировать ребёнка' : '👶 Добавить ребёнка'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Фотография */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative', textAlign: 'center' }}>
            <Avatar
              src={form.photo || undefined}
              alt={form.fullName || 'Фото ребенка'}
              sx={{
                width: 100,
                height: 100,
                mb: 1,
                border: '2px solid #e0e0e0',
                cursor: 'pointer',
              }}
            />
            <input
              accept='image/*'
              id='photo-upload'
              type='file'
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <label htmlFor='photo-upload'>
              <Button variant='outlined' component='span' size='small'>
                Загрузить фото
              </Button>
            </label>
          </Box>
        </Box>

        <TextField
          margin='dense'
          name='fullName'
          label='ФИО'
          value={form.fullName}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
          variant='outlined'
        />

        <TextField
          margin='dense'
          name='birthday'
          label='Дата рождения'
          type='date'
          value={form.birthday ? String(form.birthday).slice(0, 10) : ''}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          variant='outlined'
        />

        <TextField
          margin='dense'
          name='parentPhone'
          label='Телефон родителя'
          value={form.parentPhone}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant='outlined'
        />

        <TextField
          margin='dense'
          name='iin'
          label='ИИН'
          value={form.iin}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant='outlined'
        />

        <FormControl fullWidth margin='dense' sx={{ mb: 2 }}>
          <InputLabel>Группа</InputLabel>
          <Select
            name='groupId'
            value={
              typeof form.groupId === 'object'
                ? (form.groupId as Group)?.id || (form.groupId as string)
                : form.groupId || ''
            }
            onChange={handleSelectChange}
            label='Группа'
            variant='outlined'
            displayEmpty
            renderValue={(selected) => {
              if (!selected) return 'Не выбрано';

              const selectedGroup = groups.find(
                (g) => g._id === selected || g.id === selected,
              );
              return selectedGroup
                ? selectedGroup.name
                : typeof form.groupId === 'object'
                  ? (form.groupId as Group).name
                  : 'Текущая группа';
            }}
          >
            <MenuItem value=''>Не выбрано</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id || g._id} value={g.id || g._id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          margin='dense'
          name='parentName'
          label='ФИО родителя'
          value={form.parentName}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant='outlined'
        />

        {currentUser?.role === 'admin' && (
          <TextField
            margin='dense'
            name='paymentAmount'
            label='Сумма оплаты (тенге)'
            type='number'
            value={form.paymentAmount || 0}
            onChange={(e) => setForm({ ...form, paymentAmount: Number(e.target.value) })}
            fullWidth
            sx={{ mb: 2 }}
            variant='outlined'
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
        )}

        <TextField
          margin='dense'
          name='notes'
          label='Заметки'
          value={form.notes}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
          variant='outlined'
        />
      </DialogContent>

      <DialogActions
        sx={{
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          p: 2,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={saving}
          sx={{
            color: '#6c757d',
            '&:hover': {
              backgroundColor: '#e9ecef',
            },
          }}
        >
          Отмена
        </Button>

        <Button
          onClick={handleSave}
          variant='contained'
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '10px 24px',
            borderRadius: '25px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
            },
          }}
        >
          {saving ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : child ? (
            'Сохранить'
          ) : (
            'Добавить'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChildrenModal;
