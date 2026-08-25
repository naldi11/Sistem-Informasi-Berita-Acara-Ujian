import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const host = 'localhost';
const keyPath = 'C:/laragon/etc/ssl/laragon.key';
const certPath = 'C:/laragon/etc/ssl/laragon.crt';

let serverConfig = {};

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    serverConfig = {
        host,
        https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: serverConfig,
});

