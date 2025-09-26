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
  ListItemIcon,
  Chip,
  // IconButton
} from '@mui/material';
import { Info, Warning, Error, CheckCircleOutline } from '@mui/icons-material';
import { useAuth } from './context/AuthContext';

interface SystemNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface SystemNotificationsWidgetProps {
  onNotificationChange?: () => void; // Callback для обновления при изменении уведомлений
}

const SystemNotificationsWidget: React.FC<SystemNotificationsWidgetProps> = ({ onNotificationChange }) => {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка уведомлений
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        // В реальной реализации здесь будет вызов API для получения уведомлений
        // Пока используем тестовые данные
        const mockNotifications: SystemNotification[] = [
          {
            _id: '1',
            title: 'Обновление системы',
            message: 'Запланировано обновление системы на выходных',
            type: 'info',
            createdAt: new Date().toISOString(),
            read: false,
            priority: 'medium'
          },
          {
            _id: '2',
            title: 'Новый отчет',
            message: 'Доступен новый отчет по посещаемости',
            type: 'success',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Вчера
            read: true,
            priority: 'low'
          },
          {
            _id: '3',
            title: 'Важное уведомление',
            message: 'Не забудьте отметить посещение до 18:00',
            type: 'warning',
            createdAt: new Date().toISOString(),
            read: false,
            priority: 'high'
          }
        ];
        
        // Показываем только первые 5 уведомлений
        setNotifications(mockNotifications.slice(0, 5));
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [currentUser]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      case 'success': return <CheckCircleOutline />;
      default: return <Info />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    const diffMinutes = Math.floor(((diffMs % 86400000) % 3600000) / 60000);
    
    if (diffDays > 0) {
      return `${diffDays}д назад`;
    } else if (diffHours > 0) {
      return `${diffHours}ч назад`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}м назад`;
    } else {
      return 'Только что';
    }
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
        ) : notifications.length === 0 ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1,
            textAlign: 'center'
          }}>
            <Typography color="text.secondary" variant="body2">
              Нет уведомлений
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            maxHeight: 300
          }}>
            {notifications.map((notification) => (
              <ListItem 
                key={notification._id}
                sx={{
                  mb: 1,
                  p: 1.5,
                  backgroundColor: notification.read ? 'white' : '#e3f2fd',
                  borderRadius: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${
                    notification.type === 'error' ? '#dc3545' :
                    notification.type === 'warning' ? '#ffc107' :
                    notification.type === 'success' ? '#28a745' :
                    '#17a2b8'
                  }`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  color: notification.type === 'error' ? '#dc3545' :
                         notification.type === 'warning' ? '#ffc107' :
                         notification.type === 'success' ? '#28a745' :
                         '#17a2b8'
                }}>
                  {getTypeIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      sx={{ 
                        fontWeight: notification.read ? 500 : 600,
                        color: notification.read ? 'text.primary' : 'primary.main',
                        fontSize: '0.9rem'
                      }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: '0.85rem',
                          mb: 0.5
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                        <Chip 
                          label={notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} 
                          size="small" 
                          color={getTypeColor(notification.type) as any}
                          variant="outlined"
                          sx={{
                            fontSize: '0.65rem',
                            height: 18
                          }}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemNotificationsWidget;