import React, { useEffect, useState } from 'react';
import { Snackbar, Button, Alert, useTheme, useMediaQuery } from '@mui/material';
import PushService from '../services/pushService';

const PushNotificationPrompt: React.FC = () => {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const checkPermission = async () => {
            const permission = await PushService.checkPermission();
            console.log('Push notification permission status:', permission);

            if (permission === 'granted') {
                console.log('✅ Push notifications already granted. Prompt will not be shown.');
            }

            // Если разрешение еще не спрашивали (статус 'default')
            if (permission === 'default') {
                // Проверяем, не скрыл ли пользователь уведомление навсегда
                const isDismissed = localStorage.getItem('push_prompt_dismissed');
                console.log('Push prompt dismissed previously:', isDismissed);

                if (!isDismissed) {
                    console.log('Setting timer for push prompt (3s)');
                    // Показываем через 3 секунды после входа
                    timer = setTimeout(() => {
                        console.log('Opening push prompt');
                        setOpen(true);
                    }, 3000);
                }
            } else if (permission === 'denied') {
                console.log('❌ Push notifications denied by user in browser settings.');

                // Для мобильных устройств иногда можно показать инструкции по включению уведомлений
                const mobilePromptShown = localStorage.getItem('mobile_push_prompt_shown');
                const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (isMobileDevice && !mobilePromptShown) {
                    // Показываем напоминание о важности уведомлений на мобильных устройствах
                    setTimeout(() => {
                        setOpen(true);
                        localStorage.setItem('mobile_push_prompt_shown', 'true');
                    }, 5000);
                }
            }
        };

        checkPermission();

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

    const handleEnable = async () => {
        setOpen(false);
        const granted = await PushService.requestPermission();
        if (granted) {
            console.log('Notifications enabled via prompt');
        } else {
            // Если отказал в браузере, запоминаем, чтобы больше не показывать
            localStorage.setItem('push_prompt_dismissed', 'true');
        }
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        // Запоминаем, что пользователь закрыл уведомление
        localStorage.setItem('push_prompt_dismissed', 'true');
    };

    return (
        <Snackbar
            open={open}
            anchorOrigin={{
                vertical: isMobile ? 'top' : 'bottom',
                horizontal: 'center'
            }}
            sx={{
                top: { xs: 70, sm: 'auto' }, // 70px от верха для адаптива (под хедером)
                bottom: { xs: 'auto', sm: 24 }
            }}
        >
            <Alert
                severity="info"
                variant="filled"
                onClose={handleClose}
                action={
                    <Button color="inherit" size="small" onClick={handleEnable}>
                        Включить
                    </Button>
                }
                sx={{ width: '100%', boxShadow: 3 }}
            >
                Включите push-уведомления, чтобы получать важные уведомления о задачах и событиях
            </Alert>
        </Snackbar>
    );
};

export default PushNotificationPrompt;
