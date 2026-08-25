import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Laporan({ baus }) {
    const [search, setSearch] = useState('');

    const filteredBaus = baus.filter(b => 
        b.jadwal_ujian.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout subtitle="Arsip Berita Acara Ujian (BAU) Tervalidasi">
            <Head title="Laporan Selesai - BERITA UJIAN" />

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
                                <th>No</th>
                                <th>Mata Kuliah</th>
                                <th>Tanggal Pelaksanaan</th>
                                <th>Jam Aktual</th>
                                <th>Ruang / Kls</th>
                                <th>Kehadiran</th>
                                <th>Cetak / Arsip</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBaus.map((b, idx) => (
                                <tr key={b.id}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{b.jadwal_ujian.mata_kuliah.nama_mk}</div>
                                        <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{b.jadwal_ujian.kode_mk}</div>
                                    </td>
                                    <td>{b.jadwal_ujian.tanggal}</td>
                                    <td>{b.jam_mulai_aktual.substring(0, 5)} - {b.jam_selesai_aktual.substring(0, 5)}</td>
                                    <td>{b.jadwal_ujian.ruang} (Kl. {b.jadwal_ujian.kelas})</td>
                                    <td>
                                        Hadir: <strong>{b.jumlah_hadir}</strong> / Absen: <strong>{b.jumlah_absen}</strong>
                                    </td>
                                    <td>
                                        <a 
                                            href={route('dosen.berita-acara.pdf', { id: b.id })} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            📄 Cetak PDF Resmi
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {filteredBaus.length === 0 && (
                                <tr>
                                    <td colspan="7" className="text-center" style={{ color: 'var(--text-muted)' }}>Belum ada berita acara ujian yang divalidasi oleh Kaprodi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
