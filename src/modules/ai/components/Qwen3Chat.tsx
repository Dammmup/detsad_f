import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Divider,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Qwen3ApiService, Qwen3Response, PendingAction } from '../services/qwen3-api';

import { getCurrentUser } from '../../staff/services/auth';

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
  const [accessError, setAccessError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('qwen3-session-id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('qwen3-session-id', id);
    }
    return id;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Проверяем, является ли пользователь админом
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Показываем приветственное сообщение при открытии чата
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now(),
        text: 'Привет! Я AI-ассистент детского сада. Могу помочь:\n\n' +
          '- Получить данные (например: "Сколько активных сотрудников?")\n' +
          '- Найти нужную страницу (например: "Где страница аренды?")\n' +
          '- Управлять оплатами (например: "Отметь оплату за Марину")\n' +
          '- Анализировать зарплату (например: "Проверь зарплату Замиры")\n' +
          '- Строить отчёты (например: "Кто опоздал сегодня?")\n\n' +
          'Чем могу помочь?',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const toggleChat = () => {
    if (!isAdmin) {
      setAccessError('AI-ассистент доступен только для администраторов');
      setTimeout(() => setAccessError(null), 3000);
      return;
    }
    setIsOpen(!isOpen);
    setAccessError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleConfirm = async () => {
    if (!pendingAction || isProcessing) return;

    setIsProcessing(true);
    setPendingAction(null);

    // Индикатор загрузки
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: '...', sender: 'ai', timestamp: new Date() },
    ]);

    try {
      const result = await Qwen3ApiService.confirmAction(pendingAction);

      setMessages((prev) => prev.filter((msg) => msg.text !== '...'));
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: result.content || 'Действие выполнено.', sender: 'ai', timestamp: new Date() },
      ]);
    } catch (e: any) {
      setMessages((prev) => prev.filter((msg) => msg.text !== '...'));
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: e.message || 'Ошибка при выполнении действия.', sender: 'ai', timestamp: new Date() },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: 'Действие отменено.', sender: 'ai', timestamp: new Date() },
    ]);
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isProcessing) return;

    // Очищаем pendingAction если пользователь решил написать что-то новое
    setPendingAction(null);

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Добавляем индикатор загрузки
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: '...',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);

      const response: Qwen3Response = await Qwen3ApiService.sendMessage(
        [...messages.filter(m => m.text !== '...'), userMessage],
        location.pathname,
        selectedImage || undefined,
        sessionId,
      );

      // Убираем индикатор загрузки
      setMessages((prev) => prev.filter((msg) => msg.text !== '...'));

      // Обрабатываем навигацию
      if (response.action === 'navigate' && response.navigateTo) {
        const aiMessage: Message = {
          id: Date.now() + 2,
          text: response.content,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        setTimeout(() => {
          navigate(response.navigateTo!);
          setIsOpen(false);
        }, 1000);
      } else if (response.action === 'confirm_action' && response.pendingAction) {
        // Показываем сообщение и сохраняем pendingAction
        const aiMessage: Message = {
          id: Date.now() + 2,
          text: response.content,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setPendingAction(response.pendingAction);
      } else {
        const aiMessage: Message = {
          id: Date.now() + 2,
          text: response.content || 'Не удалось получить ответ от ИИ.',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => prev.filter((msg) => msg.text !== '...'));

      const errorMessage: Message = {
        id: Date.now() + 2,
        text: e.message || 'Произошла ошибка при обращении к AI.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      removeImage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Не показываем кнопку для не-админов
  if (!isAdmin) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000 }}>
      {accessError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Paper
            sx={{
              p: 2,
              mb: 1,
              bgcolor: '#ff5252',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">{accessError}</Typography>
          </Paper>
        </motion.div>
      )}

      {!isOpen ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={toggleChat}
            sx={{
              minWidth: 56,
              width: 56,
              height: 56,
              borderRadius: '50%',
              boxShadow: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <ChatIcon />
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Paper
              elevation={5}
              sx={{
                width: 400,
                height: 550,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0px 6px 20px rgba(0,0,0,0.25)',
                background:
                  'linear-gradient(to bottom right, #f7f9fc, #eaf1f7)',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <Box>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    AI Ассистент
                  </Typography>
                  <Typography variant='caption' sx={{ opacity: 0.8 }}>
                    Данные • Навигация • Управление
                  </Typography>
                </Box>
                <IconButton
                  size='small'
                  onClick={toggleChat}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, p: 1.5, overflowY: 'auto' }}>
                <List>
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListItem
                          sx={{
                            justifyContent:
                              msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor:
                                msg.sender === 'user'
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'white',
                              background: msg.sender === 'user'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'white',
                              color: msg.sender === 'user' ? 'white' : 'black',
                              px: 1.5,
                              py: 1,
                              borderRadius: 3,
                              maxWidth: '85%',
                              boxShadow: 1,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {msg.text === '...' ? (
                              <Box sx={{ display: 'flex', gap: 0.6 }}>
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                  style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: 'gray',
                                    borderRadius: '50%',
                                  }}
                                />
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1,
                                    delay: 0.2,
                                  }}
                                  style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: 'gray',
                                    borderRadius: '50%',
                                  }}
                                />
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1,
                                    delay: 0.4,
                                  }}
                                  style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: 'gray',
                                    borderRadius: '50%',
                                  }}
                                />
                              </Box>
                            ) : (
                              <>
                                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                                  {msg.text}
                                </Typography>
                                {msg.imageUrl && (
                                  <Box sx={{ mt: 1 }}>
                                    <motion.img
                                      src={msg.imageUrl}
                                      alt='attached'
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      style={{
                                        maxWidth: '100%',
                                        borderRadius: 8,
                                      }}
                                    />
                                  </Box>
                                )}
                                <Typography
                                  variant='caption'
                                  sx={{ opacity: 0.6 }}
                                >
                                  {msg.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </List>
              </Box>

              {/* Confirmation Buttons */}
              {pendingAction && !isProcessing && (
                <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1 }}>
                  <Button
                    variant='contained'
                    color='success'
                    size='small'
                    startIcon={<CheckIcon />}
                    onClick={handleConfirm}
                    sx={{ flex: 1, textTransform: 'none' }}
                  >
                    Подтвердить
                  </Button>
                  <Button
                    variant='outlined'
                    color='inherit'
                    size='small'
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    sx={{ flex: 1, textTransform: 'none' }}
                  >
                    Отменить
                  </Button>
                </Box>
              )}

              {/* Input */}
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
                <IconButton component='label' disabled={isProcessing}>
                  <AttachFileIcon />
                  <input
                    type='file'
                    hidden
                    accept='image/*'
                    onChange={handleImageChange}
                  />
                </IconButton>
                <TextField
                  variant='outlined'
                  size='small'
                  fullWidth
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isProcessing ? 'AI думает...' : 'Спросите что угодно...'
                  }
                  multiline
                  maxRows={4}
                  InputProps={{
                    endAdornment: imagePreview && (
                      <InputAdornment position='end'>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            component='img'
                            src={imagePreview}
                            alt='preview'
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: 1,
                              mr: 0.5,
                            }}
                          />
                          <IconButton size='small' onClick={removeImage}>
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={
                    (!inputValue.trim() && !selectedImage) || isProcessing
                  }
                  sx={{ ml: 1 }}
                >
                  <SendIcon color='primary' />
                </IconButton>
              </Box>
            </Paper>
          </motion.div>
        </AnimatePresence>
      )}
    </Box>
  );
};

export default Qwen3Chat;
