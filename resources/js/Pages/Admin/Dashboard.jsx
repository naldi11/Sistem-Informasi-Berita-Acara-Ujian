import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ stats, latestLogs, latestSchedules, activeToday }) {
    // Format date to Indonesian style (e.g., "15 Mei 2022")
    const formatIndoDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AuthenticatedLayout subtitle="Sistem Informasi Berita Acara Ujian">
            <Head title="Dashboard - BERITA UJIAN Admin" />

            {/* Bab 3 Statistics Cards */}
            <div className="sibau-stats-grid">
                {/* Card 1: Ujian Berlangsung Hari Ini */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Ujian Berlangsung Hari Ini</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H16.5V15z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{stats.total_today} JADWAL UJIAN AKTIF</div>
                            {activeToday ? (
                                <>
                                    <div className="sibau-stat-sub" style={{ fontWeight: '600', color: '#0f172a' }}>MK: {activeToday.mata_kuliah.nama_mk}</div>
                                    <div className="sibau-stat-sub">Ruang: {activeToday.ruang}</div>
                                    <div className="sibau-stat-sub">Waktu: {activeToday.jam_mulai.substring(0, 5)} - {activeToday.jam_selesai.substring(0, 5)} WIB</div>
                                </>
                            ) : (
                                <>
                                    <div className="sibau-stat-sub">Tidak ada jadwal ujian aktif</div>
                                    <div className="sibau-stat-sub">Ruang: -</div>
                                    <div className="sibau-stat-sub">Waktu: -</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 2: Berita Acara Belum Selesai */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Berita Acara Belum Selesai</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{stats.pending_bau} BAU MENUNGGU PROSES</div>
                            <div className="sibau-stat-sub">Menunggu Input Data / Validasi Dosen</div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Ringkasan Ujian Bulan Ini */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Ringkasan Ujian Bulan Ini</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{stats.validated_bau} UJIAN TELAH SELESAI</div>
                            <div className="sibau-stat-sub">FEK Universitas Methodist Indonesia</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Layout Split */}
            <div className="sibau-grid-2" style={{ marginTop: '24px' }}>
                {/* Left Column: Recent Schedules */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JADWAL UJIAN TERBARU</h3>
                        <Link href={route('admin.jadwal')} style={{ fontSize: '8.5pt', color: 'var(--text-main)', fontWeight: '700', textDecoration: 'none' }}>Lihat Semua →</Link>
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                    <th>Mata Kuliah</th>
                                    <th>Hari/Tanggal</th>
                                    <th>Ruang</th>
                                    <th>Dosen Penguji</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestSchedules.map((schedule, idx) => (
                                    <tr key={schedule.id}>
                                        <td style={{ textAlign: 'center', fontWeight: '500' }}>{idx + 1}.</td>
                                        <td>
                                            <div style={{ fontWeight: '700' }}>{schedule.mata_kuliah.nama_mk}</div>
                                            <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>MK: {schedule.kode_mk} | Kelas: {schedule.kelas}</div>
                                        </td>
                                        <td>
                                            <div>{formatIndoDate(schedule.tanggal)}</div>
                                            <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>Waktu: {schedule.jam_mulai.substring(0, 5)} - {schedule.jam_selesai.substring(0, 5)} WIB</div>
                                        </td>
                                        <td>{schedule.ruang}</td>
                                        <td>{schedule.dosen.nama}</td>
                                        <td>
                                            {schedule.status === 'berlangsung' && schedule.berita_acara?.status_validasi === 'menunggu_validasi' ? (
                                                <span className="sibau-badge badge-warning">
                                                    MENUNGGU VALIDASI
                                                </span>
                                            ) : (
                                                <span className={`sibau-badge ${
                                                    schedule.status === 'terjadwal' ? 'badge-info' : 
                                                    schedule.status === 'berlangsung' ? 'badge-warning' : 
                                                    schedule.status === 'selesai' ? 'badge-success' : 'badge-danger'
                                                }`} style={{ textTransform: 'uppercase' }}>
                                                    {schedule.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Activity Logs */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>AKTIVITAS TERKINI</h3>
                    
                    <div className="sibau-timeline">
                        {latestLogs.map((log) => {
                            const timeStr = new Date(log.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return (
                                <div key={log.id} className="sibau-timeline-item">
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
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '9.5pt' }}>Belum ada log aktivitas.</div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
