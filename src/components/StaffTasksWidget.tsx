import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useAuth } from './context/AuthContext';
import { TaskList, getTaskList, toggleTaskStatus } from '../services/taskList';

interface StaffTasksWidgetProps {
  onTaskChange?: () => void; // Callback для обновления при изменении задач
}

const StaffTasksWidget: React.FC<StaffTasksWidgetProps> = ({ onTaskChange }) => {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка задач
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        // Загружаем задачи, назначенные текущему пользователю
        const taskList = await getTaskList({ assignedTo: currentUser.id });
        // Показываем только первые 5 задач
        setTasks(taskList.slice(0, 5));
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [currentUser]);

  const handleToggleTask = async (task: TaskList) => {
    try {
      const updatedTask = await toggleTaskStatus(task._id!);
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
      
      if (onTaskChange) onTaskChange();
    } catch (err: any) {
      setError(err.message);
      console.error('Error toggling task:', err);
    }
  };

  // const handleDeleteTask = async (id: string) => {
  //   try {
  //     await deleteTask(id);
  //     setTasks(tasks.filter(task => task._id !== id));
  //     // setTaskToDelete(null);
  //
  //     if (onTaskChange) onTaskChange();
  //   } catch (err: any) {
  //     setError(err.message);
  //     console.error('Error deleting task:', err);
  //   }
  // };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }}>
      <CardContent sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        '&:last-child': {
          pb: 2
        }
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid #dee2e6'
        }}>
         
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1,
            textAlign: 'center'
          }}>
            <Typography color="text.secondary" variant="body2">
              Нет задач
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            maxHeight: 300
          }}>
            {tasks.map((task) => (
              <ListItem 
                key={task._id} 
                sx={{ 
                  mb: 1,
                  p: 1.5,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${
                    task.priority === 'high' ? '#dc3545' :
                    task.priority === 'medium' ? '#ffc107' :
                    '#28a745'
                  }`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Checkbox
                  edge="start"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task)}
                  inputProps={{ 'aria-labelledby': `task-${task._id}` }}
                  size="small"
                  sx={{ 
                    mr: 1,
                    color: task.completed ? '#28a745' : undefined,
                    '&.Mui-checked': {
                      color: '#28a745'
                    }
                  }}
                />
                <ListItemText
                  id={`task-${task._id}`}
                  primary={
                    <Typography 
                      sx={{ 
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? 'text.disabled' : '#212529',
                        fontSize: '0.9rem',
                        fontWeight: task.completed ? 400 : 500
                      }}
                    >
                      {task.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {task.category && (
                          <Chip 
                            label={task.category} 
                            size="small" 
                            variant="outlined" 
                            sx={{
                              fontSize: '0.65rem',
                              height: 18,
                              borderColor: 'rgba(0,0,0,0.1)',
                              color: 'text.secondary'
                            }}
                          />
                        )}
                        <Chip 
                          label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} 
                          size="small" 
                          color={getPriorityColor(task.priority) as any}
                          variant="filled"
                          sx={{
                            fontSize: '0.65rem',
                            height: 18,
                            fontWeight: 600
                          }}
                        />
                        {task.dueDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            📅 {formatDate(task.dueDate)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    size="small"
                    // onClick={() => setTaskToDelete(task._id!)}
                    sx={{
                      color: '#6c757d',
                      '&:hover': {
                        color: '#dc3545',
                        backgroundColor: 'rgba(220,53,69,0.1)'
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffTasksWidget;