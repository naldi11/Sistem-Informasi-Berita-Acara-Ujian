import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({
    stats,
    todaySchedules,
    latestSchedules,
    latestLogs,
}) {
    // Format date to Indonesian style (e.g., "15 Mei 2022")
    const formatIndoDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            return dateStr;
        }
    };

    const activeToday = todaySchedules[0] || null;

    return (
        <AuthenticatedLayout subtitle="Sistem Informasi Berita Acara Ujian">
            <Head title="Dashboard Dosen - SIBAU" />

            {/* Bab 3 Statistics Cards */}
            <div className="sibau-stats-grid">
                {/* Card 1: Ujian Berlangsung Hari Ini */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">
                        Ujian Berlangsung Hari Ini
                    </div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H16.5V15z"
                                />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">
                                {todaySchedules.length} JADWAL UJIAN AKTIF
                            </div>
                            {activeToday ? (
                                <>
                                    <div
                                        className="sibau-stat-sub"
                                        style={{
                                            fontWeight: '600',
                                            color: '#0f172a',
                                        }}
                                    >
                                        MK: {activeToday.mata_kuliah.nama_mk}
                                    </div>
                                    <div className="sibau-stat-sub">
                                        Ruang: {activeToday.ruang}
                                    </div>
                                    <div className="sibau-stat-sub">
                                        Waktu:{' '}
                                        {activeToday.jam_mulai.substring(0, 5)}{' '}
                                        -{' '}
                                        {activeToday.jam_selesai.substring(
                                            0,
                                            5,
                                        )}{' '}
                                        WIB
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="sibau-stat-sub">
                                        Tidak ada jadwal mengawas hari ini
                                    </div>
                                    <div className="sibau-stat-sub">
                                        Ruang: -
                                    </div>
                                    <div className="sibau-stat-sub">
                                        Waktu: -
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 2: Berita Acara Belum Selesai */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">
                        Berita Acara Belum Selesai
                    </div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">
                                {stats.draft_bau + stats.pending_bau} BAU BELUM
                                SELESAI
                            </div>
                            <div className="sibau-stat-sub">
                                Menunggu Input Data / Validasi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Ringkasan Ujian Bulan Ini */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">
                        Ringkasan Ujian Bulan Ini
                    </div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">
                                {stats.validated_bau} UJIAN TELAH SELESAI
                            </div>
                            <div className="sibau-stat-sub">
                                Arsip berita acara ujian tervalidasi
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedules */}
            <div
                className="sibau-card"
                style={{
                    padding: '20px',
                    marginBottom: '24px',
                    marginTop: '24px',
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: '11pt',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '16px',
                    }}
                >
                    JADWAL MENGAWAS HARI INI
                </h3>

                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        width: '40px',
                                        textAlign: 'center',
                                    }}
                                >
                                    No
                                </th>
                                <th>Mata Kuliah</th>
                                <th>Waktu</th>
                                <th>Ruangan</th>
                                <th>Kelas</th>
                                <th style={{ width: '220px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todaySchedules.map((s, idx) => (
                                <tr key={s.id}>
                                    <td
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: '500',
                                        }}
                                    >
                                        {idx + 1}.
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700' }}>
                                            {s.mata_kuliah.nama_mk}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '8pt',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            MK: {s.kode_mk}
                                        </div>
                                    </td>
                                    <td>
                                        {s.jam_mulai.substring(0, 5)} -{' '}
                                        {s.jam_selesai.substring(0, 5)} WIB
                                    </td>
                                    <td>{s.ruang}</td>
                                    <td>{s.kelas}</td>
                                    <td>
                                        <Link
                                            href={route(
                                                'dosen.berita-acara.input',
                                                { jadwal_id: s.id },
                                            )}
                                            className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                style={{
                                                    width: '14px',
                                                    height: '14px',
                                                    stroke: 'currentColor',
                                                    strokeWidth: 2,
                                                    fill: 'none',
                                                    display: 'inline-block',
                                                    marginRight: '4px',
                                                }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            Isi Berita Acara & Absen
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {todaySchedules.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center"
                                        style={{
                                            color: 'var(--text-muted)',
                                            padding: '24px',
                                            fontSize: '9.5pt',
                                        }}
                                    >
                                        Tidak ada jadwal mengawas hari ini.
                                        Bersantai sejenak! ☕
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="sibau-grid-2">
                {/* Latest Schedules */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '11pt',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            SEMUA JADWAL MENGAWAS
                        </h3>
                        <Link
                            href={route('dosen.jadwal')}
                            style={{
                                fontSize: '8.5pt',
                                color: 'var(--text-main)',
                                fontWeight: '700',
                                textDecoration: 'none',
                            }}
                        >
                            Lihat Semua →
                        </Link>
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            width: '40px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        No
                                    </th>
                                    <th>Mata Kuliah</th>
                                    <th>Tanggal / Jam</th>
                                    <th>Ruang / Kls</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestSchedules.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: '500',
                                            }}
                                        >
                                            {idx + 1}.
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700' }}>
                                                {s.mata_kuliah.nama_mk}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '8pt',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                MK: {s.kode_mk}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                {formatIndoDate(s.tanggal)}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '8pt',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                Waktu:{' '}
                                                {s.jam_mulai.substring(0, 5)} -{' '}
                                                {s.jam_selesai.substring(0, 5)}{' '}
                                                WIB
                                            </div>
                                        </td>
                                        <td>
                                            {s.ruang} (Kls {s.kelas})
                                        </td>
                                        <td>
                                            <span
                                                className={`sibau-badge ${
                                                    s.status === 'terjadwal'
                                                        ? 'badge-info'
                                                        : s.status ===
                                                            'berlangsung'
                                                          ? 'badge-warning'
                                                          : s.status ===
                                                              'selesai'
                                                            ? 'badge-success'
                                                            : 'badge-danger'
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Latest Logs */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '11pt',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '20px',
                        }}
                    >
                        LOG AKTIVITAS SAYA
                    </h3>

                    <div className="sibau-timeline">
                        {latestLogs.map((log) => {
                            const timeStr = new Date(
                                log.created_at,
                            ).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });
                            return (
                                <div
                                    key={log.id}
                                    className="sibau-timeline-item"
                                >
                                    <div className="sibau-timeline-badge">
                                        <div className="sibau-timeline-badge-inner"></div>
                                    </div>
                                    <div className="sibau-timeline-content">
                                        {log.aktivitas} ({timeStr})
                                    </div>
                                </div>
                            );
                        })}
                        {latestLogs.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: 'var(--text-muted)',
                                    fontSize: '9.5pt',
                                }}
                            >
                                Belum ada log aktivitas.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
