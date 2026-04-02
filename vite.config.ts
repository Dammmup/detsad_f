import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import envCompatible from 'vite-plugin-env-compatible';

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
            '/users': 'http://167.71.52.80:8080',
            '/children': 'http://167.71.52.80:8080',
            '/groups': 'http://167.71.52.80:8080',
            '/shifts': 'http://167.71.52.80:8080',
            '/child-attendance': 'http://167.71.52.80:8080',
            '/child-payment': 'http://167.71.52.80:8080',
            '/documents': 'http://167.71.52.80:8080',
            '/files': 'http://167.71.52.80:8080',
            '/reports': 'http://167.71.52.80:8080',
            '/stats': 'http://167.71.52.80:8080',
            '/holidays': 'http://167.71.52.80:8080',
            '/fine': 'http://167.71.52.80:8080',
            '/audit-log': 'http://167.71.52.80:8080',
            '/accounting': 'http://167.71.52.80:8080',
            '/qwen3-chat': 'http://167.71.52.80:8080',
            '/payroll': 'http://167.71.52.80:8080',
            '/settings': 'http://167.71.52.80:8080',
            '/staff-shifts': 'http://167.71.52.80:8080',
            '/attendance': 'http://167.71.52.80:8080',
            '/child-payments': 'http://167.71.52.80:8080',
            '/dishes': 'http://167.71.52.80:8080',
            '/products': 'http://167.71.52.80:8080',
            '/daily-menu': 'http://167.71.52.80:8080',
            '/weekly-menu-template': 'http://167.71.52.80:8080',
            '/medical-journals': 'http://167.71.52.80:8080',
            '/health-passport': 'http://167.71.52.80:8080',
            '/menu-items': 'http://167.71.52.80:8080',
            '/task-list': 'http://167.71.52.80:8080',
            '/vitaminization-journal': 'http://167.71.52.80:8080',
            '/organoleptic-journal': 'http://167.71.52.80:8080',
            '/perishable-brak': 'http://167.71.52.80:8080',
            '/product-certificates': 'http://167.71.52.80:8080',
            '/food-stock-log': 'http://167.71.52.80:8080',
            '/food-staff-health': 'http://167.71.52.80:8080',
            '/rent': 'http://167.71.52.80:8080',
            '/api': 'http://167.71.52.80:8080',
        },
    },
    build: {
        outDir: 'build',
    },
    resolve: {
        alias: {
            'src': '/src',
        }
    }
});
