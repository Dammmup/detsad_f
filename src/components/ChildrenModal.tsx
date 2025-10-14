import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress,
  Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { createUser, updateUser } from '../services/users';
import { getGroups } from '../services/groups';
import { Group, User } from '../types/common';

interface ChildrenModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
 child?: User | null;
}

const defaultForm: Omit<Partial<User>, 'role'> = {
  fullName: '',
  birthday: '',
  parentPhone: '',
  notes: '',
  iin: '',
  groupId: '',
  parentName: '',
  active: true,
  phone: '', // для совместимости с API
};

const ChildrenModal: React.FC<ChildrenModalProps> = ({ open, onClose, onSaved, child }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState<Partial<User>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchGroupsList();
      if (child) {
        setForm({
          ...defaultForm,
          ...child,
          fullName: child.fullName || '',
          phone: child.phone || '',
          iin: child.iin || '',
          groupId: child.groupId || '',
          parentName: child.parentName || '',
          parentPhone: child.parentPhone || '',
          birthday: child.birthday || '',
          notes: child.notes || '',
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [open, child]);

  const fetchGroupsList = async () => {
    try {
      const groupList = await getGroups();
      setGroups(groupList);
    } catch {
      setGroups([]);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setForm({ ...form, [name]: value });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (child && child.id) {
        // Редактирование существующего пользователя
        const userData: Partial<User> = {
          id: child.id,
          fullName: form.fullName || '',
          phone: form.phone || '',
          parentPhone: form.parentPhone || '',
          birthday: form.birthday || '',
          iin: form.iin || '',
          groupId: form.groupId || '',
          parentName: form.parentName || '',
          notes: form.notes || '',
          active: form.active !== false,
        };
        await updateUser(child.id, userData);
      } else {
        // Создание нового пользователя
        const userData = {
          fullName: form.fullName || '',
          phone: form.parentPhone || '', // Для детей phone = parentPhone!
          parentPhone: form.parentPhone || '',
          birthday: form.birthday || '',
          iin: form.iin || '',
          groupId: form.groupId || '',
          parentName: form.parentName || '',
          notes: form.notes || '',
          active: form.active !== false,
        };
        await createUser(userData);
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
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1.5rem'
        }}
      >
        {child ? '✏️ Редактировать ребёнка' : '👶 Добавить ребёнка'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          margin="dense"
          name="fullName"
          label="ФИО"
          value={form.fullName}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
          variant="outlined"
        />
        
        <TextField
          margin="dense"
          name="birthday"
          label="Дата рождения"
          type="date"
          value={form.birthday ? String(form.birthday).slice(0, 10) : ''}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          variant="outlined"
        />
        
        <TextField
          margin="dense"
          name="parentPhone"
          label="Телефон родителя"
          value={form.parentPhone}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant="outlined"
        />
        
        <TextField
          margin="dense"
          name="iin"
          label="ИИН"
          value={form.iin}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant="outlined"
        />
        
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel>Группа</InputLabel>
          <Select
            name="groupId"
            value={(typeof form.groupId === 'object' && form.groupId ? form.groupId.id || form.groupId._id : form.groupId) || ''}
            onChange={handleSelectChange}
            label="Группа"
            variant="outlined"
          >
            <MenuItem value="">Не выбрано</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          margin="dense"
          name="parentName"
          label="ФИО родителя"
          value={form.parentName}
          onChange={handleChange}
          fullWidth
          sx={{ mb: 2 }}
          variant="outlined"
        />
        
        <TextField
          margin="dense"
          name="notes"
          label="Заметки"
          value={form.notes}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
          variant="outlined"
        />
      </DialogContent>
      
      <DialogActions
        sx={{
          background: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          p: 2,
          justifyContent: 'space-between'
        }}
      >
        <Button
          onClick={handleClose}
          disabled={saving}
          sx={{
            color: '#6c757d',
            '&:hover': {
              backgroundColor: '#e9ecef'
            }
          }}
        >
          Отмена
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
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
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)'
            }
          }}
        >
          {saving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (child ? 'Сохранить' : 'Добавить')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChildrenModal;