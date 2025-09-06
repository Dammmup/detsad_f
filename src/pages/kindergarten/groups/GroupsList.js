import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { withRouter } from 'react-router-dom';
import GroupForm from './GroupForm';
import { useGroups } from '../../../context/GroupsContext';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(7), // добавлен отступ сверху, чтобы не пряталась за Header
    zIndex: 1201, // выше AppBar/Header
    position: 'relative',
  },
  table: {
    minWidth: 650,
  },
  actionCell: {
    width: '150px',
  },
}));

const GroupsList = () => {
  const classes = useStyles();
  const { 
    groups, 
    loading, 
    error,
    deleteGroup,
    fetchGroups 
  } = useGroups();
  
  const [openForm, setOpenForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Show error message if any
  useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error',
      });
    }
  }, [error]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenForm = (group = null) => {
    setEditingGroup(group);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingGroup(null);
  };

  const handleOpenDeleteDialog = (group) => {
    setSelectedGroup(group);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedGroup(null);
  };

  const handleSaveGroup = (values) => {
    // В реальном приложении здесь будет вызов API
    if (editingGroup) {
      // Обновление существующей группы
      // setGroups(groups.map(g => 
      //   g.id === editingGroup.id ? { ...g, ...values } : g
      // ));
      // showSnackbar('Группа успешно обновлена', 'success');
    } else {
      // Добавление новой группы
      // const newGroup = {
      //   id: Math.max(0, ...groups.map(g => g.id)) + 1,
      //   ...values,
      //   childrenCount: 0,
      //   teacher: mockTeachers.find(t => t.id === values.teacherId)?.name || ''
      // };
      // setGroups([...groups, newGroup]);
      // showSnackbar('Группа успешно добавлена', 'success');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      await deleteGroup(selectedGroup.id);
      setSnackbar({
        open: true,
        message: 'Группа успешно удалена',
        severity: 'success',
      });
      handleCloseDeleteDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении группы',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4" component="h1">
          Группы детского сада
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Добавить группу
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="groups table">
          <TableHead>
            <TableRow>
              <TableCell>Название группы</TableCell>
              <TableCell>Возрастная категория</TableCell>
              <TableCell align="right">Количество детей</TableCell>
              <TableCell>Воспитатель</TableCell>
              <TableCell className={classes.actionCell}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id} hover>
                <TableCell component="th" scope="row">
                  {group.name}
                </TableCell>
                <TableCell>{group.ageRange}</TableCell>
                <TableCell align="right">
                  {group.childrenCount} / {group.maxCapacity}
                </TableCell>
                <TableCell>{group.teacher}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenForm(group)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error"
                    onClick={() => handleOpenDeleteDialog(group)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Форма добавления/редактирования группы */}
      <GroupForm
        open={openForm}
        onClose={handleCloseForm}
        group={selectedGroup}
        onSave={handleSaveGroup}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить группу "{selectedGroup?.name}"? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};



export default withRouter(GroupsList);
