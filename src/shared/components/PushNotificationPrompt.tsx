import React, { useEffect, useState } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';
import PushService from '../services/pushService';

const PushNotificationPrompt: React.FC = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        const checkPermission = async () => {
            const permission = await PushService.checkPermission();

            // Если разрешение еще не спрашивали (статус 'default')
            if (permission === 'default') {
                // Проверяем, не скрыл ли пользователь уведомление навсегда
                const isDismissed = localStorage.getItem('push_prompt_dismissed');

                if (!isDismissed) {
                    // Показываем через 3 секунды после входа
                    timer = setTimeout(() => {
                        setOpen(true);
                    }, 3000);
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
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 80, sm: 24 } }}
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
                Включите push-уведомления, чтобы получать важные напоминания
            </Alert>
        </Snackbar>
    );
};

export default PushNotificationPrompt;
