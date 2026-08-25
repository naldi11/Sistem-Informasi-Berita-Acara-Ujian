import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function BeritaAcaraList({ schedules }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [search, setSearch] = useState('');

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
            return { active: false, label: 'Waktu Habis', tooltip: 'Batas pengisian telah lewat (hanya selama ujian berlangsung)' };
        }
        return { active: true, label: 'Isi BAU', tooltip: 'Ujian sedang berlangsung' };
    };

    const filteredSchedules = schedules.filter(s => 
        s.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout subtitle="Kelola Berita Acara Ujian (BAU) Saya">
            <Head title="Kelola BAU - BERITA UJIAN" />

            {/* Flash Messages */}
            {flash.error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '10pt', fontWeight: '600' }}>
                    ⚠️ {flash.error}
                </div>
            )}
            {flash.success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '10pt', fontWeight: '600' }}>
                    ✅ {flash.success}
                </div>
            )}

            {/* Filter */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <input 
                    type="text" 
                    className="sibau-input" 
                    placeholder="Cari mata kuliah..." 
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
                                <th>Ruangan / Kelas</th>
                                <th>Mata Kuliah</th>
                                <th>Dosen Pengampu</th>
                                <th>Jam Terjadwal</th>
                                <th>Jam Aktual</th>
                                <th>T.A / Angkatan</th>
                                <th>Jumlah Hadir / Absen</th>
                                <th>Status BAU</th>
                                <th style={{ width: '200px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map((s) => {
                                const bau = s.berita_acara;
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
                                            <div>{s.ruang}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Kelas {s.kelas}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.nama_mk}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.kode_mk}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.dosen_pengampu ? s.mata_kuliah.dosen_pengampu.nama : <span style={{ color: 'var(--text-muted)' }}>-</span>}</div>
                                            {s.mata_kuliah.dosen_pengampu && (
                                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>NIP: {s.mata_kuliah.nip_dosen}</div>
                                            )}
                                        </td>
                                        <td>{s.jam_mulai.substring(0, 5)} - {s.jam_selesai.substring(0, 5)}</td>
                                        <td>
                                            {bau ? (
                                                <div>{bau.jam_mulai_aktual.substring(0, 5)} - {bau.jam_selesai_aktual.substring(0, 5)}</div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '9pt' }}>Belum diisi</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.tahun_akademik}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Sem: {s.semester_aktif}</div>
                                        </td>
                                        <td>
                                            {bau ? (
                                                <div>Hadir: <strong>{bau.jumlah_hadir}</strong> / Absen: <strong>{bau.jumlah_absen}</strong></div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '9pt' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {bau ? (
                                                <span className={`sibau-badge ${
                                                    bau.status_validasi === 'tervalidasi' ? 'badge-success' : 
                                                    bau.status_validasi === 'menunggu_validasi' ? 'badge-warning' : 'badge-draft'
                                                }`}>
                                                    {bau.status_validasi === 'menunggu_validasi' ? 'Menunggu Validasi' : bau.status_validasi}
                                                </span>
                                            ) : (
                                                <span className="sibau-badge badge-draft">Belum Dibuat</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(!bau || bau.status_validasi === 'draft') ? (() => {
                                                    const state = getExamActiveState(s.tanggal, s.jam_mulai, s.jam_selesai);
                                                    if (state.active) {
                                                        return (
                                                            <Link 
                                                                href={route('dosen.berita-acara.input', { jadwal_id: s.id })} 
                                                                className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                                                style={{ textDecoration: 'none' }}
                                                                title={state.tooltip}
                                                            >
                                                                {bau ? '✏️ Edit BAU' : '📝 Isi BAU Baru'}
                                                            </Link>
                                                        );
                                                    } else {
                                                        return (
                                                            <button 
                                                                className="sibau-btn sibau-btn-secondary sibau-btn-sm"
                                                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                                                title={state.tooltip}
                                                                disabled
                                                            >
                                                                {bau ? '✏️ Edit BAU' : `📝 ${state.label}`}
                                                            </button>
                                                        );
                                                    }
                                                })() : (
                                                    <span style={{ fontSize: '9pt', color: 'var(--text-muted)', display: 'inline-block', padding: '6px 0' }}>
                                                        {bau.status_validasi === 'tervalidasi' ? 'Selesai' : 'Telah Dikirim'}
                                                    </span>
                                                )}

                                                {bau && (
                                                    <a 
                                                        href={route('dosen.berita-acara.pdf', { id: bau.id })} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="sibau-btn sibau-btn-secondary sibau-btn-sm"
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        📄 PDF
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                             {filteredSchedules.length === 0 && (
                                 <tr>
                                     <td colSpan="12" className="text-center" style={{ color: 'var(--text-muted)' }}>Berita acara tidak ditemukan.</td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
