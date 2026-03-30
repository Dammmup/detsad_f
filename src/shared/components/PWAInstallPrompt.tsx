import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close, Share, AddBox } from '@mui/icons-material';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'other'>('other');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // 1. Проверяем, не запущено ли уже как PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Определяем платформу
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    setPlatform(isIOS ? 'ios' : 'other');

    // 3. Слушаем событие установки для Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Показываем через небольшую задержку, чтобы не пугать сразу
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Для iOS показываем подсказку, если не standalone
    if (isIOS && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      console.log('User dismissed the A2HS prompt');
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    // Можно сохранить в localStorage, чтобы не надоедать (например, на 7 дней)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Проверка, не закрывал ли пользователь уведомление недавно
  useEffect(() => {
    const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (lastDismissed) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(lastDismissed) < sevenDays) {
        setShowPrompt(false);
      }
    }
  }, [showPrompt]);

  if (!showPrompt) return null;

  return (
    <Dialog
      open={showPrompt}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          position: 'fixed',
          bottom: isMobile ? 16 : 32,
          margin: isMobile ? '0 16px' : 0,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
      }}
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-end' } }}
    >
      <DialogContent sx={{ p: 3, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8, opacity: 0.6 }}
        >
          <Close fontSize="small" />
        </IconButton>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
            Установить приложение
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Установите Aldamiram на рабочий стол для быстрого доступа и получения уведомлений.
          </Typography>
        </Box>

        {platform === 'ios' ? (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              1. Нажмите кнопку <Share sx={{ mx: 0.5, color: '#007aff' }} fontSize="small" /> (Поделиться)
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              2. Выберите <AddBox sx={{ mx: 0.5 }} fontSize="small" /> "На экран Домой"
            </Typography>
          </Box>
        ) : (
          <Button
            fullWidth
            variant="contained"
            onClick={handleInstallClick}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(118, 75, 162, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd6 0%, #694291 100%)',
              },
            }}
          >
            Установить сейчас
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
