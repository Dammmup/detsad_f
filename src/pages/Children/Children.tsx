import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Add, Edit, Delete} from '@mui/icons-material';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api/users';
import { getGroups } from '../../services/api/groups';
import { Group,User } from '../../types/common';
import { exportChildrenList } from '../../utils/excelExport';
import ExportMenuButton from '../../components/ExportMenuButton';
import axios from 'axios';
import ChildrenModal from '../../components/ChildrenModal';

const Children: React.FC = () => {
  const [children, setChildren] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<User | null>(null);

  // Экспорт: скачать файл
  const handleExportDownload = () => {
    exportChildrenList(children, undefined);
  };

  // Экспорт: отправить на email
  const handleExportEmail = async () => {
    try {
      await axios.post('/exports/children', { action: 'email' });
      alert('Документ отправлен на почту администратора');
    } catch (e) {
      alert('Ошибка отправки на почту');
    }
  };

  // Загрузка детей
  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getUsers();
      setChildren(users.filter(u => u.type === 'child'));
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка групп
  const fetchGroupsList = async () => {
    try {
      const groupList = await getGroups();
      setGroups(groupList);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchGroupsList();
  }, []);

  const handleOpenModal = (child?: User) => {
    setEditingChild(child || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingChild(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Удалить ребёнка?')) return;
    setLoading(true);
    try {
      await deleteUser(id);
      fetchChildren();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };


  const findGroupById = (groupId: string | undefined): React.ReactNode => {
    const group = groups.find(group => group.id === groupId);
    return group ? group.name : 'Неизвестная группа';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
        Список детей
      </Typography>
      <Box mb={2}>
        <ExportMenuButton
          onDownload={handleExportDownload}
          onSendEmail={handleExportEmail}
          label="Экспортировать"
        />
      </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
          Добавить ребёнка
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Дата рождения</TableCell>
              <TableCell>Телефон родителя</TableCell>
              <TableCell>ИИН</TableCell>
              <TableCell>Группа</TableCell>
              <TableCell>Заметки</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map(child => (
              <TableRow key={child.id || child._id}>
                <TableCell>{child.fullName}</TableCell>
                <TableCell>
                  {child.birthday
                    ? new Date(child.birthday).toISOString().split("T")[0] // YYYY-MM-DD
                    : ""}
                </TableCell>
                <TableCell>{child.phone}</TableCell>
                <TableCell>{child.iin}</TableCell>
                <TableCell>{findGroupById(child.groupId)}</TableCell>
                <TableCell>{child.notes}</TableCell>
                <TableCell>{child.active ? 'Активен' : 'Неактивен'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenModal(child)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(child.id || child._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ChildrenModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={fetchChildren}
        child={editingChild}
      />
    </Box>
  );
};

export default Children;
