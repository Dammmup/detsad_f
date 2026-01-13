/**
 * Утилита для сбора метаданных устройства клиента
 * Используется для учёта посещаемости сотрудников
 */

export interface DeviceMetadata {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    deviceModel: string; // Модель устройства (iPhone 12, Samsung Galaxy S21 и т.д.)
    browser: string; // Браузер (Chrome, Safari, Firefox и т.д.)
    os: string; // Операционная система
}

/**
 * Определяет тип устройства по User-Agent
 */
function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
    const uaLower = ua.toLowerCase();

    // Проверка на планшет
    if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(uaLower)) {
        return 'tablet';
    }

    // Проверка на мобильное устройство
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|windows phone/i.test(uaLower)) {
        return 'mobile';
    }

    return 'desktop';
}

/**
 * Извлекает модель устройства из User-Agent
 */
function parseDeviceModel(ua: string): string {
    // iPhone модели
    const iphoneMatch = ua.match(/iPhone\s*(\d+[,\d]*)?/i);
    if (iphoneMatch) {
        // Пытаемся определить модель iPhone по версии iOS
        const iosMatch = ua.match(/iPhone OS (\d+)/);
        if (iosMatch) {
            const iosVersion = parseInt(iosMatch[1]);
            // Приблизительное определение модели по версии iOS
            if (iosVersion >= 17) return 'iPhone 15 / 14 / 13';
            if (iosVersion >= 15) return 'iPhone 13 / 12 / 11';
            if (iosVersion >= 13) return 'iPhone 11 / XS / XR';
            return 'iPhone (старая модель)';
        }
        return 'iPhone';
    }

    // iPad модели
    if (/iPad/i.test(ua)) {
        return 'iPad';
    }

    // Samsung модели
    const samsungMatch = ua.match(/SM-([A-Z]\d{3}[A-Z]?)/i);
    if (samsungMatch) {
        const model = samsungMatch[1].toUpperCase();
        // Определяем линейку Samsung
        if (model.startsWith('S9')) return 'Samsung Galaxy S23/S24';
        if (model.startsWith('S90')) return 'Samsung Galaxy S23/S24';
        if (model.startsWith('S91')) return 'Samsung Galaxy S24';
        if (model.startsWith('S21') || model.startsWith('G99')) return 'Samsung Galaxy S21/S22';
        if (model.startsWith('A')) return `Samsung Galaxy A${model.substring(1, 3)}`;
        if (model.startsWith('M')) return `Samsung Galaxy M${model.substring(1, 3)}`;
        return `Samsung (${model})`;
    }

    // Xiaomi модели
    const xiaomiMatch = ua.match(/(Redmi|Mi|POCO|Xiaomi)\s*([A-Za-z0-9\s]+?)[\s;)]/i);
    if (xiaomiMatch) {
        return `${xiaomiMatch[1]} ${xiaomiMatch[2]}`.trim();
    }

    // Huawei модели
    const huaweiMatch = ua.match(/(HUAWEI|Honor)\s*([A-Za-z0-9\-]+)/i);
    if (huaweiMatch) {
        return `${huaweiMatch[1]} ${huaweiMatch[2]}`;
    }

    // OnePlus модели
    const oneplusMatch = ua.match(/OnePlus\s*([A-Za-z0-9]+)/i);
    if (oneplusMatch) {
        return `OnePlus ${oneplusMatch[1]}`;
    }

    // Google Pixel
    const pixelMatch = ua.match(/Pixel\s*(\d+[a-z]?)/i);
    if (pixelMatch) {
        return `Google Pixel ${pixelMatch[1]}`;
    }

    // OPPO модели
    const oppoMatch = ua.match(/OPPO\s*([A-Za-z0-9]+)/i);
    if (oppoMatch) {
        return `OPPO ${oppoMatch[1]}`;
    }

    // Vivo модели
    const vivoMatch = ua.match(/vivo\s*([A-Za-z0-9]+)/i);
    if (vivoMatch) {
        return `Vivo ${vivoMatch[1]}`;
    }

    // Mac
    if (/Macintosh/i.test(ua)) {
        if (/MacBook/i.test(ua)) return 'MacBook';
        return 'Mac';
    }

    // Windows PC
    if (/Windows/i.test(ua)) {
        return 'Windows PC';
    }

    // Linux
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
        return 'Linux PC';
    }

    // Android без конкретной модели
    if (/Android/i.test(ua)) {
        return 'Android устройство';
    }

    return 'Неизвестное устройство';
}

/**
 * Определяет браузер из User-Agent
 */
function parseBrowser(ua: string): string {
    if (/Edg/i.test(ua)) return 'Microsoft Edge';
    if (/OPR|Opera/i.test(ua)) return 'Opera';
    if (/YaBrowser/i.test(ua)) return 'Яндекс.Браузер';
    if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
    return 'Другой браузер';
}

/**
 * Определяет ОС из User-Agent
 */
function parseOS(ua: string): string {
    if (/iPhone|iPad|iPod/i.test(ua)) {
        const match = ua.match(/OS (\d+[_\d]*)/);
        return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
    }
    if (/Android/i.test(ua)) {
        const match = ua.match(/Android (\d+[.\d]*)/);
        return match ? `Android ${match[1]}` : 'Android';
    }
    if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
    if (/Windows NT 6.3/i.test(ua)) return 'Windows 8.1';
    if (/Windows NT 6.2/i.test(ua)) return 'Windows 8';
    if (/Windows NT 6.1/i.test(ua)) return 'Windows 7';
    if (/Mac OS X/i.test(ua)) {
        const match = ua.match(/Mac OS X (\d+[_.\d]*)/);
        return match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
    }
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Неизвестная ОС';
}

/**
 * Собирает метаданные устройства пользователя
 * @returns Объект с метаданными устройства
 */
export function collectDeviceMetadata(): DeviceMetadata {
    const ua = navigator.userAgent;

    return {
        userAgent: ua,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceType: detectDeviceType(ua),
        deviceModel: parseDeviceModel(ua),
        browser: parseBrowser(ua),
        os: parseOS(ua),
    };
}

/**
 * Возвращает краткое описание устройства для отображения
 */
export function getDeviceDescription(metadata: DeviceMetadata): string {
    const deviceEmoji = metadata.deviceType === 'mobile' ? '📱'
        : metadata.deviceType === 'tablet' ? '📱'
            : '💻';

    return `${deviceEmoji} ${metadata.deviceModel} • ${metadata.browser} • ${metadata.os}`;
}

/**
 * Возвращает короткое описание для компактного отображения
 */
export function getShortDeviceDescription(metadata: DeviceMetadata): string {
    const deviceEmoji = metadata.deviceType === 'mobile' ? '📱'
        : metadata.deviceType === 'tablet' ? '📱'
            : '💻';

    return `${deviceEmoji} ${metadata.deviceModel}`;
}
