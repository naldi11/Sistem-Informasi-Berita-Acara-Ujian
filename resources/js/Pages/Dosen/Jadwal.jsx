import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';

export default function Jadwal({ schedules, filters = {} }) {
    const [search, setSearch] = useState(filters.cari || '');

    const pencarianPertama = useRef(true);
    useEffect(() => {
        if (pencarianPertama.current) {
            pencarianPertama.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                route('dosen.jadwal'),
                { cari: search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AuthenticatedLayout subtitle="Jadwal Mengawas Ujian Saya">
            <Head title="Jadwal Mengawas - SIBAU" />
            {/* Filter */}
            <div
                className="sibau-card"
                style={{ padding: '20px', marginBottom: '24px' }}
            >
                <input
                    type="text"
                    className="sibau-input"
                    placeholder="Cari mata kuliah atau ruang..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '350px' }}
                />
            </div>

            {/* Table */}
            <div className="sibau-card">
                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th>Mata Kuliah</th>
                                <th>Tanggal Pelaksanaan</th>
                                <th>Waktu</th>
                                <th>Ruangan</th>
                                <th>Kelas</th>
                                <th>Jenis</th>
                                <th className="text-center">Jumlah Peserta</th>
                                <th>Status</th>
                                <th style={{ width: '120px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.data.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>
                                            {s.mata_kuliah.nama_mk}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '8.5pt',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            {s.kode_mk}
                                        </div>
                                    </td>
                                    <td>{s.tanggal}</td>
                                    <td>
                                        {s.jam_mulai.substring(0, 5)} -{' '}
                                        {s.jam_selesai.substring(0, 5)}
                                    </td>
                                    <td>{s.ruang}</td>
                                    <td>Kelas {s.kelas}</td>
                                    <td className="text-center">
                                        <span
                                            className={`sibau-badge ${s.jenis_ujian === 'UTS' ? 'badge-info' : 'badge-success'}`}
                                        >
                                            {s.jenis_ujian}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <strong>
                                            {s.peserta_ujians_count}
                                        </strong>{' '}
                                        mahasiswa
                                    </td>
                                    <td>
                                        <span
                                            className={`sibau-badge ${
                                                s.status === 'terjadwal'
                                                    ? 'badge-info'
                                                    : s.status === 'berlangsung'
                                                      ? 'badge-warning'
                                                      : s.status === 'selesai'
                                                        ? 'badge-success'
                                                        : 'badge-danger'
                                            }`}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td>
                                        {s.status !== 'selesai' &&
                                        s.status !== 'dibatalkan' ? (
                                            <Link
                                                href={route(
                                                    'dosen.berita-acara.input',
                                                    { jadwal_id: s.id },
                                                )}
                                                className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                                style={{
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                📝 Isi BAU
                                            </Link>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: '9pt',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                Tervalidasi / Selesai
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {schedules.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="text-center"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Jadwal mengawas tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination paginator={schedules} />
            </div>
        </AuthenticatedLayout>
    );
}
