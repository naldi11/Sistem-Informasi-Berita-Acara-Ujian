import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function BeritaAcaraList({ baus }) {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');

    const form = useForm({
        status_validasi: '',
    });

    const handleValidate = (id, status) => {
        if (confirm(`Apakah Anda yakin ingin memvalidasi berita acara ini menjadi: ${status.toUpperCase()}?`)) {
            form.setData('status_validasi', status);
            form.post(route('admin.berita-acara.validate', { id: id }));
        }
    };

    const filteredBaus = baus.filter(b => {
        const matchesSearch = b.jadwal_ujian.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase()) || 
            b.jadwal_ujian.dosen.nama.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'Semua' || b.status_validasi === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Counts
    const total = baus.length;
    const pending = baus.filter(b => b.status_validasi === 'menunggu_validasi').length;
    const validated = baus.filter(b => b.status_validasi === 'tervalidasi').length;
    const draft = baus.filter(b => b.status_validasi === 'draft').length;

    return (
        <AuthenticatedLayout subtitle="Validasi Berita Acara Ujian (BAU)">
            <Head title="Validasi Berita Acara - SIBAU" />

            {/* Stats Cards Split (Gambar 3.8 style) */}
            <div className="sibau-stats-grid">
                {/* Total Berita Acara */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Total Berita Acara</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{total} DOKUMEN</div>
                            <div className="sibau-stat-sub">Total berita acara tersimpan</div>
                        </div>
                    </div>
                </div>

                {/* Menunggu Validasi */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Menunggu Validasi</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM12 11.25v3.375m1.5-1.5h-3" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{pending} MENUNGGU PROSES</div>
                            <div className="sibau-stat-sub">Perlu verifikasi & persetujuan</div>
                        </div>
                    </div>
                </div>

                {/* Telah Valid */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Telah Valid</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{validated} TELAH VALIDASI</div>
                            <div className="sibau-stat-sub">Telah disetujui Kaprodi</div>
                        </div>
                    </div>
                </div>

                {/* Masih Draft */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Masih Draft</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val">{draft} DRAFT</div>
                            <div className="sibau-stat-sub">Belum dikirim oleh dosen</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        className="sibau-input" 
                        placeholder="Cari mata kuliah atau dosen..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                    <SearchableSelect 
                        options={[
                            { value: 'Semua', label: 'Semua Status Validasi' },
                            { value: 'draft', label: 'Draft (Belum Dikirim)' },
                            { value: 'menunggu_validasi', label: 'Menunggu Validasi' },
                            { value: 'tervalidasi', label: 'Tervalidasi (Valid)' }
                        ]}
                        value={filterStatus} 
                        onChange={e => setFilterStatus(e.target.value)}
                        style={{ width: '200px' }}
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="sibau-card">
                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                <th>Mata Kuliah</th>
                                <th>Dosen Penguji / Pengawas</th>
                                <th>Waktu Pelaksanaan</th>
                                <th className="text-center" style={{ width: '150px' }}>Kehadiran</th>
                                <th style={{ width: '150px' }}>Status Validasi</th>
                                <th style={{ width: '260px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBaus.map((b, idx) => (
                                <tr key={b.id}>
                                    <td style={{ textAlign: 'center', fontWeight: '500' }}>{idx + 1}.</td>
                                    <td>
                                        <div style={{ fontWeight: '700' }}>{b.jadwal_ujian.mata_kuliah.nama_mk}</div>
                                        <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>MK: {b.jadwal_ujian.kode_mk} | Kelas: {b.jadwal_ujian.kelas}</div>
                                    </td>
                                    <td>{b.jadwal_ujian.dosen.nama}</td>
                                    <td>
                                        <div>{b.jadwal_ujian.tanggal}</div>
                                        <div style={{ fontSize: '8pt', color: 'var(--text-muted)' }}>
                                            Aktual: {b.jam_mulai_aktual ? b.jam_mulai_aktual.substring(0, 5) : '-'} - {b.jam_selesai_aktual ? b.jam_selesai_aktual.substring(0, 5) : '-'} WIB
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        Hadir: <strong style={{ color: '#16a34a' }}>{b.jumlah_hadir}</strong><br />
                                        Absen: <strong style={{ color: '#dc2626' }}>{b.jumlah_absen}</strong>
                                    </td>
                                    <td>
                                        <span className={`sibau-badge ${
                                            b.status_validasi === 'tervalidasi' ? 'badge-success' : 
                                            b.status_validasi === 'menunggu_validasi' ? 'badge-warning' : 'badge-draft'
                                        }`}>
                                            {b.status_validasi === 'tervalidasi' ? 'Valid' : b.status_validasi === 'menunggu_validasi' ? 'Menunggu Validasi' : b.status_validasi}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <a 
                                                href={route('admin.berita-acara.pdf', { id: b.id })} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="sibau-btn sibau-btn-pdf sibau-btn-sm"
                                                style={{ textDecoration: 'none', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                📄 {b.status_validasi === 'tervalidasi' ? 'Cetak PDF' : 'Preview PDF'}
                                            </a>
                                            {b.status_validasi === 'menunggu_validasi' && (
                                                <>
                                                    <button onClick={() => handleValidate(b.id, 'tervalidasi')} className="sibau-btn sibau-btn-approve sibau-btn-sm" style={{ padding: '6px 10px' }}>Setujui</button>
                                                    <button onClick={() => handleValidate(b.id, 'draft')} className="sibau-btn sibau-btn-reject sibau-btn-sm" style={{ padding: '6px 10px' }}>Tolak</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBaus.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center" style={{ color: 'var(--text-muted)', padding: '24px' }}>Berita acara tidak ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
