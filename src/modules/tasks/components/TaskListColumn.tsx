import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Checkbox,
  Chip,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { User } from '../../../shared/types/common';
import { useAuth } from '../../../app/context/AuthContext';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import {
  getTaskList,
  createTask,
  deleteTask,
  toggleTaskStatus,
  markTaskAsCompleted,
} from '../services/taskList';
import { TaskList } from '../../../shared/types/taskList';
import { getUsers } from '../../staff/services/userService';

interface TaskListColumnProps {
  onTaskChange?: () => void;
}

const TaskListColumn: React.FC<TaskListColumnProps> = ({ onTaskChange }) => {
  const { user: currentUser } = useAuth();
  const canManageTasks = ['admin', 'manager'].includes(currentUser?.role || '');
  const [tasks, setTasks] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskAssignedToSpecificUser, setNewTaskAssignedToSpecificUser] =
    useState<string>('');
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);


  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;
    const fetchTasks = async (retryCount = 0) => {
      if (retryCount === 0) {
        setLoading(true);
        setError(null);
      }
      try {
        const taskList: any = await getTaskList({});
        const tasksArray = Array.isArray(taskList) ? taskList : (taskList?.items || taskList?.data || []);
        if (!cancelled) setTasks(tasksArray);
      } catch (err: any) {
        if (cancelled) return;
        if (retryCount < 1 && err?.response?.status === 500) {
          setTimeout(() => { if (!cancelled) fetchTasks(retryCount + 1); }, 2000);
          return;
        }
        setError(err.message);
        console.error('Error fetching tasks:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTasks();
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    if (!showAddTaskDialog || !canManageTasks || users.length > 0) return;

    let cancelled = false;
    const fetchUsers = async (retryCount = 0) => {
      try {
        const userList = await getUsers();
        if (!cancelled) setUsers(userList);
      } catch (err: any) {
        if (cancelled) return;
        if (retryCount < 1 && err?.response?.status === 500) {
          setTimeout(() => { if (!cancelled) fetchUsers(retryCount + 1); }, 2000);
          return;
        }
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, [showAddTaskDialog, canManageTasks, users.length]);

  useEffect(() => {
    // Обновляем бейдж при изменении списка задач
    if (tasks && 'setAppBadge' in navigator) {
      const activeCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
      if (activeCount > 0) {
        (navigator as any).setAppBadge(activeCount).catch((err: any) => {
          console.error('Error setting app badge:', err);
        });
      } else {
        (navigator as any).clearAppBadge().catch((err: any) => {
          console.error('Error clearing app badge:', err);
        });
      }
    }
  }, [tasks]);

  const handleAddTask = async () => {
    if (!canManageTasks) {
      setError('Недостаточно прав для добавления уведомлений');
      return;
    }
    if (!newTaskTitle.trim() || !currentUser || !currentUser.id) return;

    try {
      const newTask = {
        title: newTaskTitle,
        description: newTaskDescription,
        assignedTo: currentUser.id,
        assignedBy: currentUser.id,
        priority: newTaskPriority,
        status: 'pending' as const,
        category: newTaskCategory,
        assignedToSpecificUser: newTaskAssignedToSpecificUser || undefined,
      };

      const createdTask = await createTask(newTask);
      setTasks([createdTask, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskCategory('');
      setNewTaskAssignedToSpecificUser('');
      setShowAddTaskDialog(false);

      if (onTaskChange) onTaskChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating task:', err);
    }
  };

  const handleToggleTask = async (task: TaskList) => {
    if (!currentUser || !currentUser.id) return;
    const taskId = task._id;
    if (!taskId) return;

    try {
      let updatedTask: TaskList;


      if (task.status === 'completed') {
        updatedTask = await toggleTaskStatus(taskId, currentUser.id);
      } else if (canManageTasks) {
        updatedTask = await markTaskAsCompleted(taskId, currentUser.id);
      } else {
        updatedTask = await toggleTaskStatus(taskId, currentUser.id);
      }


      setTasks(tasks.map((t) => (t._id === taskId ? updatedTask : t)));

      if (onTaskChange) onTaskChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!canManageTasks) {
      setError('Недостаточно прав для удаления уведомлений');
      return;
    }
    try {
      await deleteTask(id);
      setTasks(tasks.filter((task) => task._id !== id));
      setTaskToDelete(null);

      if (onTaskChange) onTaskChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting task:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': {
            pb: 2,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: '1px solid #dee2e6',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px 8px 0 0',
            marginLeft: '-16px',
            marginRight: '-16px',
            marginTop: '-16px',
          }}
        >
          <Typography
            variant='h6'
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}
          >
            📋 Уведомления
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AuditLogButton entityType="task" />
            {canManageTasks && (
              <Button
                variant='contained'
                size='small'
                startIcon={<Add />}
                onClick={() => setShowAddTaskDialog(true)}
                sx={{
                  backgroundColor: 'rgb(24, 144, 255)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'green',
                  },
                }}
              >
                Добавить
              </Button>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <Typography>Загрузка уведомлений...</Typography>
          </Box>
        ) : tasks.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
              textAlign: 'center',
            }}
          >
            <Typography color='text.secondary'>Нет уведомлений</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              overflowY: 'auto',
              maxHeight: 320,
              flexShrink: 1,
            }}
          >
            {tasks.map((task) => (
              <Box
                key={task._id}
                sx={{
                  mb: 2,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${task.priority === 'high'
                    ? '#dc3545'
                    : task.priority === 'medium'
                      ? '#ffc107'
                      : '#28a745'
                    }`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: task.status === 'completed' ? 500 : 600,
                      textDecoration:
                        task.status === 'completed' ? 'line-through' : 'none',
                      color:
                        task.status === 'completed'
                          ? 'text.disabled'
                          : '#212529',
                      fontSize: '0.95rem',
                      flexGrow: 1,
                      pr: 2,
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Checkbox
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleTask(task)}
                    size='small'
                    sx={{
                      ml: 1,
                      color:
                        task.status === 'completed' ? '#28a745' : undefined,
                      '&.Mui-checked': {
                        color: '#28a745',
                      },
                    }}
                  />
                </Box>

                {task.description && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      mb: 1,
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                {task.status === 'completed' && task.completedBy && (
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    Выполнено:{' '}
                    {task.completedBy
                      ? typeof task.completedBy === 'object'
                        ? task.completedBy.fullName
                        : users.find((u) => u._id === task.completedBy)
                          ?.fullName
                      : 'Пользователь'}{' '}
                    {task.completedAt
                      ? `(${formatDate(task.completedAt)})`
                      : ''}
                  </Typography>
                )}

                {task.status === 'cancelled' && task.cancelledBy && (
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 1,
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    Отменено:{' '}
                    {task.cancelledBy
                      ? typeof task.cancelledBy === 'object'
                        ? task.cancelledBy.fullName
                        : users.find((u) => u._id === task.cancelledBy)
                          ?.fullName
                      : 'Пользователь'}{' '}
                    {task.cancelledAt
                      ? `(${formatDate(task.cancelledAt)})`
                      : ''}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {task.category && (
                      <Chip
                        label={task.category}
                        size='small'
                        variant='outlined'
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          borderColor: 'rgba(0,0,0,0.1)',
                          color: 'text.secondary',
                        }}
                      />
                    )}
                    <Chip
                      label={
                        task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)
                      }
                      size='small'
                      color={getPriorityColor(task.priority) as any}
                      variant='filled'
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  {canManageTasks && (
                    <IconButton
                      size='small'
                      onClick={() => setTaskToDelete(task._id!)}
                      sx={{
                        color: '#6c757d',
                        '&:hover': {
                          color: '#dc3545',
                          backgroundColor: 'rgba(220,53,69,0.1)',
                        },
                      }}
                    >
                      <Delete fontSize='small' />
                    </IconButton>
                  )}
                </Box>

                {task.dueDate && (
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 1,
                      color:
                        task.priority === 'high'
                          ? '#dc3545'
                          : task.priority === 'medium'
                            ? '#ffc107'
                            : '#28a745',
                      fontWeight: 500,
                    }}
                  >
                    📅 Срок: {formatDate(task.dueDate)}
                  </Typography>
                )}

                {/* Отображение информации о назначенном пользователе - только для администраторов */}
                {canManageTasks &&
                  task.assignedToSpecificUser && (
                    <Typography
                      variant='caption'
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color: '#6c757d',
                        fontStyle: 'italic',
                      }}
                    >
                      🎯 Назначено:{' '}
                      {task.assignedToSpecificUser
                        ? typeof task.assignedToSpecificUser === 'object'
                          ? task.assignedToSpecificUser.fullName
                          : users.find(
                            (u) => u.id === task.assignedToSpecificUser,
                          )?.fullName
                        : 'Сотрудник'}
                    </Typography>
                  )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>

      {/* Диалог добавления уведомления */}
      <Dialog
        open={showAddTaskDialog}
        onClose={() => setShowAddTaskDialog(false)}
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
          📝 Добавить новое уведомление
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin='dense'
            label='Заголовок уведомления'
            fullWidth
            variant='outlined'
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin='dense'
            label='Описание'
            fullWidth
            variant='outlined'
            multiline
            rows={3}
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Приоритет</InputLabel>
              <Select
                value={newTaskPriority}
                label='Приоритет'
                onChange={(e) =>
                  setNewTaskPriority(
                    e.target.value as 'low' | 'medium' | 'high' | 'urgent',
                  )
                }
              >
                <MenuItem value='low'>🟢 Низкий</MenuItem>
                <MenuItem value='medium'>🟡 Средний</MenuItem>
                <MenuItem value='high'>🔴 Высокий</MenuItem>
                <MenuItem value='urgent'>🚨 Срочный</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin='dense'
              label='Категория'
              fullWidth
              variant='outlined'
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
            />
          </Box>

          {/* Выбор сотрудника для назначения задачи - только для администраторов */}
          {canManageTasks && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Назначить конкретному сотруднику</InputLabel>
              <Select
                value={newTaskAssignedToSpecificUser}
                label='Назначить конкретному сотруднику'
                onChange={(e) =>
                  setNewTaskAssignedToSpecificUser(e.target.value as string)
                }
                sx={{ backgroundColor: 'white' }}
              >
                <MenuItem value=''>
                  <em>Для всех</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id || user.id} value={user._id || user.id}>
                    {user.fullName} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            p: 2,
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={() => setShowAddTaskDialog(false)}
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
            onClick={handleAddTask}
            variant='contained'
            disabled={!newTaskTitle.trim()}
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
            Добавить уведомление
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        maxWidth='xs'
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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '1.5rem',
          }}
        >
          ❌ Подтверждение удаления
        </DialogTitle>
        <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
          <Typography variant='h6' sx={{ mb: 1 }}>
            Вы уверены?
          </Typography>
          <Typography color='text.secondary'>
            Вы уверены, что хотите удалить это уведомление?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            p: 2,
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={() => setTaskToDelete(null)}
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
            onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
            variant='contained'
            color='error'
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TaskListColumn;
