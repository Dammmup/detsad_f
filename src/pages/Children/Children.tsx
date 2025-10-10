import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery
} from '@mui/material';
import { Add, Edit, Delete} from '@mui/icons-material';
import childrenApi, { Child } from '../../services/children';
import { getGroups } from '../../services/groups';
import { Group } from '../../types/common';
import { exportChildrenList } from '../../utils/excelExport';
import ExportMenuButton from '../../components/ExportMenuButton';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';
import ChildrenModal from '../../components/ChildrenModal';

const Children: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Экспорт: скачать файл
  const handleExportDownload = () => {
    exportChildrenList(children, undefined);
  };

  // Экспорт: отправить на email
  const handleExportEmail = async () => {
    try {
      await axios.post(`${API_BASE_URL}/exports/children`, { action: 'email' }, { withCredentials: true });
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
      const childrenList = await childrenApi.getAll();
      setChildren(childrenList);
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

  const handleOpenModal = (child?: Child) => {
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
      await childrenApi.deleteItem(id);
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

  const isMobile = useMediaQuery('(max-width:900px)');

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="space-between"
        mb={2}
        gap={isMobile ? 2 : 0}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: isMobile ? 1 : 0 }}>
          Список детей
        </Typography>
        <Box mb={isMobile ? 0 : 2} display={isMobile ? 'flex' : 'block'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1 : 0}>
          <ExportMenuButton
            onDownload={handleExportDownload}
            onSendEmail={handleExportEmail}
            label="Экспортировать"
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          sx={{ width: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}
        >
          Добавить ребёнка
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          width: '100%',
          overflowX: isMobile ? 'auto' : 'visible',
          boxShadow: isMobile ? 1 : 3,
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>ФИО</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Дата рождения</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Телефон родителя</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>ИИН</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Группа</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Заметки</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Статус</TableCell>
              <TableCell align="right" sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map(child => (
              <TableRow key={child.id || child._id}>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.fullName}</TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                  {child.birthday
                    ? new Date(child.birthday).toISOString().split("T")[0]
                    : ""}
                </TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.parentPhone}</TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.iin}</TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{findGroupById(child.groupId)}</TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.notes}</TableCell>
                <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.active ? 'Активен' : 'Неактивен'}</TableCell>
                <TableCell align="right" sx={{ p: isMobile ? 1 : 2 }}>
                  <IconButton size={isMobile ? 'small' : 'medium'} onClick={() => handleOpenModal(child)}><Edit fontSize={isMobile ? 'small' : 'medium'} /></IconButton>
                  <IconButton size={isMobile ? 'small' : 'medium'} onClick={() => handleDelete(child.id || child._id)}><Delete fontSize={isMobile ? 'small' : 'medium'} /></IconButton>
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
