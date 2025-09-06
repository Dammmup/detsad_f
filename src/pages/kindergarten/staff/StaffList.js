import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useStaff } from '../../../context/StaffContext';
import { makeStyles } from '@mui/styles';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  searchField: {
    marginBottom: theme.spacing(2),
    maxWidth: 400,
  },
  table: {
    minWidth: 650,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    marginRight: theme.spacing(2),
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
  },
  roleChip: {
    marginRight: theme.spacing(1),
    '&.admin': {
      backgroundColor: theme.palette.error.light,
      color: theme.palette.error.contrastText,
    },
    '&.teacher': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
    '&.assistant': {
      backgroundColor: theme.palette.secondary.light,
      color: theme.palette.secondary.contrastText,
    },
  },
  actions: {
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  noData: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

const StaffList = () => {
  const classes = useStyles();
  const history = useHistory();
  const {
    staff,
    loading,
    error,
    fetchStaff,
    removeStaff,
  } = useStaff();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleEdit = (id) => {
    history.push(`/app/kindergarten/staff/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await removeStaff(id);
      } catch (error) {
        console.error('Ошибка при удалении сотрудника:', error);
      }
    }
  };

  const handleAddNew = () => {
    history.push('/app/kindergarten/staff/new');
  };

  // Фильтрация сотрудников по поисковому запросу
  const filteredStaff = staff.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.fullName?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(searchTerm) ||
      member.role?.toLowerCase().includes(searchLower)
    );
  });

  // Пагинация
  const paginatedStaff = filteredStaff.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getRoleLabel = (role) => {
    const roles = {
   Admin: 'Администратор',
   Teacher: 'Воспитатель',
   Assistant: 'Помощник воспитателя',
   Cook: 'Повар',
   Cleaner: 'Уборщик',
   Security: 'Охранник',
   Nurse: 'Медсестра',
    };
    return roles[role] || role;
  };

  if (error) {
    return (
      <div className={classes.root}>
        <Alert severity="error">Ошибка при загрузке списка сотрудников: {error}</Alert>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div>
        <Typography variant="h4" component="h1">
          Сотрудники
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Добавить сотрудника
        </Button>
      </div>

      <TextField
        className={classes.searchField}
        variant="outlined"
        placeholder="Поиск сотрудников..."
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
      />

      <Paper>
        <TableContainer>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Должность</TableCell>
                <TableCell>Контакты</TableCell>
                <TableCell>Группа</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !staff.length ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box py={4}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={classes.noData}>
                    <PersonIcon fontSize="large" />
                    <Typography variant="subtitle1">Сотрудники не найдены</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm ? 'Попробуйте изменить параметры поиска' : 'Добавьте первого сотрудника'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <div className={classes.nameCell}>
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className={classes.avatar}
                          />
                        ) : (
                          <PersonIcon className={classes.avatar} />
                        )}
                        <div>
                          <Typography variant="subtitle1">{member.fullName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {member.id}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(member.role)}
                        size="small"
                        className={`${classes.roleChip} ${member.role}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <Typography variant="body2">{member.email}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {member.phone}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.group ? (
                        <Chip
                          icon={<GroupIcon fontSize="small" />}
                          label={member.group.name}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Не назначено
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" className={classes.actions}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(member.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(member.id)}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} из ${count !== -1 ? count : `больше чем ${to}`}`
          }
        />
      </Paper>
    </div>
  );
};

export default StaffList;
