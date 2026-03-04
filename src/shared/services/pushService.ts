import apiClient from '../utils/api';

const VAPID_PUBLIC_KEY = 'BJWw0OiYXGMun4pefNLc629UXVSQFiRUUR7YTq_7Pt7JCOp5azqLR0YgXjDXLj3Zd7-540KF8t7BLv6_NU_Q94I';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const PushService = {
    async subscribeUser() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications are not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('User is subscribed:', subscription);

            // Используем системный apiClient, который сам добавит baseURL и Token
            await apiClient.post('/users/push/subscribe', {
                subscription
            });

            console.log('Subscription saved on server');
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
        }
    },

    async unsubscribeUser() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Используем системный apiClient
                await apiClient.post('/users/push/unsubscribe', {
                    endpoint: subscription.endpoint
                });
                console.log('User is unsubscribed');
            }
        } catch (error) {
            console.error('Error unsubscribing', error);
        }
    },

    async checkPermission() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await this.subscribeUser();
            return true;
        }
        return false;
    }
};

export default PushService;
