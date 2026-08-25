import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Jadwal({ schedules }) {
    const [search, setSearch] = useState('');

    const formatIndoDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) { return dateStr; }
    };

    const getExamActiveState = (tanggal, jamMulai, jamSelesai) => {
        const now = new Date();
        const [year, month, day] = tanggal.split('-').map(Number);
        const [startH, startM] = jamMulai.split(':').map(Number);
        const [endH, endM] = jamSelesai.split(':').map(Number);

        const start = new Date(year, month - 1, day, startH, startM, 0);
        const end = new Date(year, month - 1, day, endH, endM, 0);

        if (now < start) {
            return { active: false, label: 'Belum Mulai', tooltip: `Ujian baru dimulai pukul ${jamMulai.substring(0, 5)} WIB` };
        } else if (now > end) {
            return { active: false, label: 'Waktu Habis', tooltip: `Batas pengisian telah lewat (hanya selama ujian berlangsung s/d pukul ${jamSelesai.substring(0, 5)} WIB)` };
        }
        return { active: true, label: 'Isi BAU', tooltip: 'Ujian sedang berlangsung' };
    };

    const filteredSchedules = schedules.filter(s => 
        s.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase()) ||
        s.ruang.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout subtitle="Jadwal Mengawas Ujian Saya">
            <Head title="Jadwal Mengawas - BERITA UJIAN" />
            {/* Filter */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <input 
                    type="text" 
                    className="sibau-input" 
                    placeholder="Cari mata kuliah atau ruang..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: '350px' }}
                />
            </div>

            {/* Table */}
            <div className="sibau-card">
                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th>Hari, Tanggal</th>
                                <th>Jam</th>
                                <th>Ruangan</th>
                                <th>Mata Kuliah</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th className="text-center">Peserta</th>
                                <th style={{ width: '120px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map((s) => {
                                const getIndonesianDay = (dateStr) => {
                                    if (!dateStr) return '';
                                    const date = new Date(dateStr);
                                    const dayIndex = date.getDay();
                                    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                    return days[dayIndex];
                                };
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{getIndonesianDay(s.tanggal)}, {s.tanggal}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.jam_mulai.substring(0, 5)} - {s.jam_selesai.substring(0, 5)}</div>
                                        </td>
                                        <td>
                                            <div>{s.ruang}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Kelas {s.kelas}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.nama_mk}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.kode_mk}</div>
                                        </td>
                                        <td>
                                            <span className={`sibau-badge ${s.jenis_ujian === 'UTS' ? 'badge-info' : 'badge-success'}`}>
                                                {s.jenis_ujian}
                                            </span>
                                        </td>
                                        <td>
                                            {s.status === 'berlangsung' && s.berita_acara?.status_validasi === 'menunggu_validasi' ? (
                                                <span className="sibau-badge badge-warning">
                                                    MENUNGGU VALIDASI
                                                </span>
                                            ) : (
                                                <span className={`sibau-badge ${
                                                    s.status === 'terjadwal' ? 'badge-info' : 
                                                    s.status === 'berlangsung' ? 'badge-warning' : 
                                                    s.status === 'selesai' ? 'badge-success' : 'badge-danger'
                                                }`} style={{ textTransform: 'uppercase' }}>
                                                    {s.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <strong>{s.peserta_ujians.length}</strong> orang
                                        </td>
                                        <td>
                                            {(() => {
                                                const bau = s.berita_acara;
                                                if (bau && bau.status_validasi !== 'draft') {
                                                    return (
                                                        <span className={`sibau-badge ${bau.status_validasi === 'tervalidasi' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '8pt' }}>
                                                            {bau.status_validasi === 'tervalidasi' ? 'Selesai' : 'Telah Dikirim'}
                                                        </span>
                                                    );
                                                }
                                                if (s.status === 'selesai') {
                                                    return <span style={{ fontSize: '9pt', color: 'var(--text-muted)' }}>Tervalidasi / Selesai</span>;
                                                }
                                                if (s.status === 'dibatalkan') {
                                                    return <span style={{ fontSize: '9pt', color: 'var(--text-muted)' }}>Dibatalkan</span>;
                                                }

                                                const state = getExamActiveState(s.tanggal, s.jam_mulai, s.jam_selesai);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {state.active ? (
                                                            <Link 
                                                                href={route('dosen.berita-acara.input', { jadwal_id: s.id })} 
                                                                className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                                                style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}
                                                                title={state.tooltip}
                                                            >
                                                                📝 {bau ? 'Edit BAU' : 'Isi BAU'}
                                                            </Link>
                                                        ) : (
                                                            <button 
                                                                className="sibau-btn sibau-btn-secondary sibau-btn-sm"
                                                                style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}
                                                                title={state.tooltip}
                                                                disabled
                                                            >
                                                                📝 {state.label}
                                                            </button>
                                                        )}
                                                        <Link 
                                                            href={route('dosen.delegasi')}
                                                            className="sibau-btn sibau-btn-secondary sibau-btn-sm" 
                                                            style={{ textDecoration: 'none', padding: '6px 10px', width: '100%', textAlign: 'center' }}
                                                        >
                                                            Pilih Pengganti
                                                        </Link>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSchedules.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center" style={{ color: 'var(--text-muted)' }}>Jadwal mengawas tidak ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
