import { Link } from '@inertiajs/react';

/**
 * Navigasi halaman untuk paginator Laravel.
 * `paginator` adalah objek hasil ->paginate() yang dikirim lewat props Inertia.
 */
export default function Pagination({ paginator, className = '' }) {
    if (!paginator || paginator.last_page <= 1) {
        return null;
    }

    const { links, from, to, total } = paginator;

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 ${className}`}
        >
            <p className="text-sm text-gray-600">
                Menampilkan <strong>{from ?? 0}</strong>–
                <strong>{to ?? 0}</strong> dari <strong>{total}</strong> data
            </p>

            <nav className="flex flex-wrap gap-1" aria-label="Navigasi halaman">
                {links.map((link, i) =>
                    link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            preserveScroll
                            preserveState
                            aria-current={link.active ? 'page' : undefined}
                            className={`rounded-md border px-3 py-1.5 text-sm transition ${
                                link.active
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={i}
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}
