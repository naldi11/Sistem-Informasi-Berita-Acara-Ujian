import '../css/app.css';
import '../css/sibau.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title.endsWith(` - ${appName}`) ? title : `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const container = el || document.getElementById('app');
        if (container) {
            createRoot(container).render(<App {...props} />);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                const fallbackContainer = document.getElementById('app');
                if (fallbackContainer) {
                    createRoot(fallbackContainer).render(<App {...props} />);
                }
            });
        }
    },
    progress: {
        color: '#4B5563',
    },
});
