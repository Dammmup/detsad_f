import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';

// Переключайте этот адрес для смены окружения (локально или сервер)
// const PROXY_TARGET = 'http://167.71.52.80:8080'; // Удаленный сервер
const PROXY_TARGET = 'http://localhost:8080'; // Локальный сервер

export default defineConfig({
    plugins: [
        react(),
        svgr(),
        tsconfigPaths(),
        envCompatible({ prefix: 'REACT_APP_' }),
    ],
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/users': PROXY_TARGET,
            '/children': PROXY_TARGET,
            '/groups': PROXY_TARGET,
            '/shifts': PROXY_TARGET,
            '/child-attendance': PROXY_TARGET,
            '/child-payment': PROXY_TARGET,
            '/documents': PROXY_TARGET,
            '/files': PROXY_TARGET,
            '/reports': PROXY_TARGET,
            '/stats': PROXY_TARGET,
            '/holidays': PROXY_TARGET,
            '/fine': PROXY_TARGET,
            '/audit-log': PROXY_TARGET,
            '/accounting': PROXY_TARGET,
            '/ai': PROXY_TARGET,
            '/payroll': PROXY_TARGET,
            '/settings': PROXY_TARGET,
            '/staff-shifts': PROXY_TARGET,
            '/attendance': PROXY_TARGET,
            '/child-payments': PROXY_TARGET,
            '/dishes': PROXY_TARGET,
            '/products': PROXY_TARGET,
            '/daily-menu': PROXY_TARGET,
            '/weekly-menu-template': PROXY_TARGET,
            '/medical-journals': PROXY_TARGET,
            '/health-passport': PROXY_TARGET,
            '/menu-items': PROXY_TARGET,
            '/task-list': PROXY_TARGET,
            '/vitaminization-journal': PROXY_TARGET,
            '/organoleptic-journal': PROXY_TARGET,
            '/perishable-brak': PROXY_TARGET,
            '/product-certificates': PROXY_TARGET,
            '/food-staff-daily-log': PROXY_TARGET,
            '/external-specialists': PROXY_TARGET,
            '/food-stock-log': PROXY_TARGET,
            '/food-staff-health': PROXY_TARGET,
            '/rent': PROXY_TARGET,
            '/api': PROXY_TARGET,
        },
    },
    build: {
        outDir: 'build',
    },
    resolve: {
        alias: {
            'src': path.resolve(__dirname, './src'),
        }
    }
});
