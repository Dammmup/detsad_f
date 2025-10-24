import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, Button, IconButton, Typography, List, ListItem, ListItemText, Divider, InputAdornment } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Chat as ChatIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Qwen3ApiService } from '../services/qwen3-api';
import { useLocation } from 'react-router-dom';
import { initUIStateCollector } from '../utils/uiStateCollector';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
}

const Qwen3Chat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => {
    // Проверяем, есть ли уже sessionId в localStorage
    let storedSessionId = localStorage.getItem('qwen3-session-id');
    if (!storedSessionId) {
      // Генерируем новый sessionId
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('qwen3-session-id', storedSessionId);
    }
    return storedSessionId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Инициализируем сборщик состояния UI при монтировании компонента
  useEffect(() => {
    const cleanup = initUIStateCollector(sessionId);
    
    // Очищаем при размонтировании компонента
    return () => {
      cleanup();
    };
  }, [sessionId]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Функция для определения команд навигации из ответа ИИ
  const extractNavigationCommand = (response: string): string | null => {
    const lowerResponse = response.toLowerCase();
    
    // Проверяем, содержит ли ответ команду навигации
    if (lowerResponse.includes('перенаправляю вас на страницу детей') || lowerResponse.includes('дети')) {
      return '/app/children';
    } else if (lowerResponse.includes('перенаправляю вас на страницу сотрудников') || lowerResponse.includes('сотрудники')) {
      return '/app/staff';
    } else if (lowerResponse.includes('перенаправляю вас на страницу отчетов') || lowerResponse.includes('отчеты')) {
      return '/app/reports';
    } else if (lowerResponse.includes('перенаправляю вас на страницу документов') || lowerResponse.includes('документы')) {
      return '/app/documents';
    } else if (lowerResponse.includes('перенаправляю вас на страницу групп') || lowerResponse.includes('группы')) {
      return '/app/groups';
    } else if (lowerResponse.includes('перенаправляю вас на страницу настроек') || lowerResponse.includes('настройки')) {
      return '/app/settings';
    } else if (lowerResponse.includes('перенаправляю вас в медицинский кабинет') || lowerResponse.includes('мед кабинет')) {
      return '/app/med';
    } else if (lowerResponse.includes('главная страница') || lowerResponse.includes('главная') || lowerResponse.includes('dashboard')) {
      return '/app/dashboard';
    } else if (lowerResponse.includes('посещаемость')) {
      return '/app/children/attendance';
    }
    
    return null;
 };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        
        // Создаем предварительный просмотр
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Пожалуйста, выберите изображение');
      }
    }
  };

  // Функция для захвата скриншота текущей страницы
 const captureScreenshot = async () => {
    try {
      // Проверяем поддержку Web API для захвата экрана
      if ('getDisplayMedia' in navigator) {
        // Используем getDisplayMedia для захвата экрана
        const stream = await (navigator as any).mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' }
        });
        
        const track = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(track);
        const blob = await imageCapture.grabFrame();
        
        // Останавливаем трансляцию
        track.stop();
        
        // Создаем File из Blob
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
        setSelectedImage(file);
        
        // Создаем предварительный просмотр
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Альтернативный метод с использованием html2canvas
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(document.body);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
            setSelectedImage(file);
            
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при захвате скриншота:', error);
      alert('Не удалось захватить скриншот. Пожалуйста, разрешите доступ к экрану или используйте кнопку "Прикрепить файл".');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

 const handleSend = async () => {
    if ((inputValue.trim() === '' && !selectedImage) || isProcessing) return;

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Если есть изображение, добавляем его к сообщению
    if (selectedImage) {
      userMessage.imageUrl = URL.createObjectURL(selectedImage);
    }

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Отправляем сообщение в ИИ и получаем ответ
      const aiResponse = await Qwen3ApiService.sendMessage([...messages, userMessage], location.pathname, selectedImage || undefined, sessionId);
      
      // Создаем сообщение ИИ
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Проверяем, содержит ли ответ команду навигации
      const navigationPath = extractNavigationCommand(aiResponse);
      if (navigationPath) {
        navigate(navigationPath);
      }
      
      // Очищаем изображение после отправки
      removeImage();
    } catch (error: any) {
      console.error('Error getting response from Qwen3 API:', error);
      
      // В случае ошибки добавляем сообщение об ошибке
      let errorMessageText = 'Извините, возникла ошибка при соединении с ИИ.';
      
      if (error.message.includes('API ключ')) {
        errorMessageText = 'API ключ для Qwen3 не установлен или недействителен. Пожалуйста, проверьте настройки.';
      } else if (error.message.includes('HTTP error')) {
        errorMessageText = `Ошибка соединения с API: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: errorMessageText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
 };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      {!isOpen ? (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ChatIcon />}
          onClick={toggleChat}
          sx={{
            minWidth: 56,
            width: 56,
            height: 56,
            borderRadius: '50%',
            padding: 1.5,
          }}
          disabled={isProcessing}
        >
          <ChatIcon />
        </Button>
      ) : (
        <Paper
          elevation={3}
          sx={{
            width: 350,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Заголовок чата */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 1.5,
              backgroundColor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">Qwen3 Ассистент</Typography>
            <IconButton
              size="small"
              onClick={toggleChat}
              sx={{ color: 'white' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* История сообщений */}
          <Box
            sx={{
              flex: 1,
              padding: 1,
              overflowY: 'auto',
              backgroundColor: '#f5f5f5',
            }}
          >
            <List>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    padding: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      padding: 1,
                      borderRadius: 2,
                      backgroundColor: message.sender === 'user' ? 'primary.main' : '#e0e0e0',
                      color: message.sender === 'user' ? 'white' : 'black',
                    }}
                  >
                    {message.text && (
                      <ListItemText
                        primary={message.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { wordWrap: 'break-word' },
                        }}
                      />
                    )}
                    {message.imageUrl && (
                      <Box sx={{ mt: 1, textAlign: 'center' }}>
                        <img
                          src={message.imageUrl}
                          alt="Вложенное изображение"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: 'right',
                        marginTop: 0.5,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Поле ввода */}
          <Divider />
          <Box sx={{ display: 'flex', padding: 1, alignItems: 'center' }}>
            <IconButton
              size="small"
              component="label"
              disabled={isProcessing}
              title="Прикрепить файл"
            >
              <AttachFileIcon fontSize="small" />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
                disabled={isProcessing}
              />
            </IconButton>
            <IconButton
              size="small"
              onClick={captureScreenshot}
              disabled={isProcessing}
              title="Сделать скриншот страницы"
              sx={{ marginLeft: 0.5 }}
            >
              <ChatIcon fontSize="small" />
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isProcessing ? "Обработка запроса..." : "Напишите сообщение..."}
              multiline
              maxRows={4}
              disabled={isProcessing}
              InputProps={{
                endAdornment: imagePreview ? (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Предварительный просмотр"
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1,
                          marginRight: 1,
                          objectFit: 'cover'
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={removeImage}
                        disabled={isProcessing}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
              sx={{ marginLeft: 1 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Qwen3Chat;