import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, List, ListItem, Divider, InputAdornment, Button
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  AttachFile as AttachFileIcon,
  ScreenshotMonitor as ScreenshotIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Qwen3ApiService } from '../services/qwen3-api';
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
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('qwen3-session-id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('qwen3-session-id', id);
    }
    return id;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const cleanup = initUIStateCollector(sessionId);
    return () => cleanup();
  }, [sessionId]);

  const toggleChat = () => setIsOpen(!isOpen);

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

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isProcessing) return;

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
      // Симулируем “печатает...”
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: '...', sender: 'ai', timestamp: new Date() },
      ]);

      const aiResponse = await Qwen3ApiService.sendMessage(
        [...messages, userMessage],
        location.pathname,
        selectedImage || undefined,
        sessionId
      );

      // Убираем временное сообщение “...”
      setMessages((prev) => prev.filter((msg) => msg.text !== '...'));

      const aiMessage: Message = {
        id: Date.now() + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      console.error(e);
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

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000 }}>
      {!isOpen ? (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleChat}
            sx={{
              minWidth: 56,
              width: 56,
              height: 56,
              borderRadius: '50%',
              boxShadow: 4,
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
                width: 380,
                height: 520,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0px 6px 20px rgba(0,0,0,0.25)',
                background: 'linear-gradient(to bottom right, #f7f9fc, #eaf1f7)',
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
                  background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                  color: 'white',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Qwen3 Ассистент
                </Typography>
                <IconButton size="small" onClick={toggleChat} sx={{ color: 'white' }}>
                  <CloseIcon fontSize="small" />
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
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: msg.sender === 'user' ? '#1976d2' : 'white',
                              color: msg.sender === 'user' ? 'white' : 'black',
                              px: 1.5,
                              py: 1,
                              borderRadius: 3,
                              maxWidth: '75%',
                              boxShadow: 1,
                            }}
                          >
                            {msg.text === '...' ? (
                              <Box sx={{ display: 'flex', gap: 0.6 }}>
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                  style={{ width: 6, height: 6, backgroundColor: 'gray', borderRadius: '50%' }}
                                />
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                  style={{ width: 6, height: 6, backgroundColor: 'gray', borderRadius: '50%' }}
                                />
                                <motion.div
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                  style={{ width: 6, height: 6, backgroundColor: 'gray', borderRadius: '50%' }}
                                />
                              </Box>
                            ) : (
                              <>
                                <Typography variant="body2">{msg.text}</Typography>
                                {msg.imageUrl && (
                                  <Box sx={{ mt: 1 }}>
                                    <motion.img
                                      src={msg.imageUrl}
                                      alt="attached"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      style={{
                                        maxWidth: '100%',
                                        borderRadius: 8,
                                      }}
                                    />
                                  </Box>
                                )}
                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
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

              {/* Input */}
              <Divider />
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
                <IconButton component="label" disabled={isProcessing}>
                  <AttachFileIcon />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </IconButton>
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isProcessing ? 'ИИ думает...' : 'Введите сообщение...'}
                  multiline
                  maxRows={4}
                  InputProps={{
                    endAdornment: imagePreview && (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={imagePreview}
                            alt="preview"
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: 1,
                              mr: 0.5,
                            }}
                          />
                          <IconButton size="small" onClick={removeImage}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
                  sx={{ ml: 1 }}
                >
                  <SendIcon color="primary" />
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
