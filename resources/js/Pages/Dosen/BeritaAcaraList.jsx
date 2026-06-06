import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function BeritaAcaraList({ schedules }) {
    const [search, setSearch] = useState('');

    const filteredSchedules = schedules.filter(s => 
        s.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout subtitle="Kelola Berita Acara Ujian (BAU) Saya">
            <Head title="Kelola BAU - SIBAU" />

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
                                <th>Mata Kuliah</th>
                                <th>Tanggal / Kelas</th>
                                <th>Jam Terjadwal</th>
                                <th>Jam Aktual</th>
                                <th>Jumlah Hadir / Absen</th>
                                <th>Status BAU</th>
                                <th style={{ width: '200px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map((s) => {
                                const bau = s.berita_acara;
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.nama_mk}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.kode_mk}</div>
                                        </td>
                                        <td>
                                            <div>{s.tanggal}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Kelas {s.kelas}</div>
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
                                                {(!bau || bau.status_validasi === 'draft') ? (
                                                    <Link 
                                                        href={route('dosen.berita-acara.input', { jadwal_id: s.id })} 
                                                        className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        {bau ? '✏️ Edit BAU' : '📝 Isi BAU Baru'}
                                                    </Link>
                                                ) : (
                                                    <span style={{ fontSize: '9pt', color: 'var(--text-muted)', display: 'inline-block', padding: '6px 0' }}>Telah Dikirim</span>
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
                                    <td colspan="7" className="text-center" style={{ color: 'var(--text-muted)' }}>Berita acara tidak ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
