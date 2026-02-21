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
            '/users': 'http://localhost:8080',
            '/children': 'http://localhost:8080',
            '/groups': 'http://localhost:8080',
            '/shifts': 'http://localhost:8080',
            '/child-attendance': 'http://localhost:8080',
            '/child-payment': 'http://localhost:8080',
            '/documents': 'http://localhost:8080',
            '/files': 'http://localhost:8080',
            '/reports': 'http://localhost:8080',
            '/stats': 'http://localhost:8080',
            '/holidays': 'http://localhost:8080',
            '/fine': 'http://localhost:8080',
            '/audit-log': 'http://localhost:8080',
            '/api': 'http://localhost:8080',
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
