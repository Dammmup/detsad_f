/* eslint-disable no-restricted-globals */
self.addEventListener('push', function (event) {
    let data = {};
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('Error parsing push data as JSON:', e);
        data = {
            title: 'Уведомление',
            body: event.data.text()
        };
    }

    const options = {
        body: data.body || 'Новое сообщение',
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: {
            url: data.url || '/'
        },
        vibrate: [100, 50, 100]
    };

    // Обновляем бейдж иконки приложения, если он передан
    if (data.badge !== undefined && 'setAppBadge' in navigator) {
        event.waitUntil(navigator.setAppBadge(data.badge));
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'Детский сад', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            const url = event.notification.data.url;

            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
