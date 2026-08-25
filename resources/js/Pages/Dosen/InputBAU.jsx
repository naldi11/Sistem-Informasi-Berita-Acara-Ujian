import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function InputBAU({ schedule }) {
    const bau = schedule.berita_acara;
    
    // Build initial states
    const initialAttendance = {};

    schedule.peserta_ujians.forEach(p => {
        initialAttendance[p.nim] = p.kehadiran === 'hadir' ? 'hadir' : 'absen';
    });

    const form = useForm({
        jam_mulai_aktual: bau ? bau.jam_mulai_aktual.substring(0, 5) : schedule.jam_mulai.substring(0, 5),
        jam_selesai_aktual: bau ? bau.jam_selesai_aktual.substring(0, 5) : schedule.jam_selesai.substring(0, 5),
        catatan: bau ? (bau.catatan || '') : '',
        status_validasi: 'draft',
        attendance: initialAttendance,
    });

    const handleAttendanceChange = (nim, val) => {
        const updated = { ...form.data.attendance, [nim]: val };
        form.setData('attendance', updated);
    };



    const submit = (status) => {
        form.data.status_validasi = status;
        form.post(route('dosen.berita-acara.save', { jadwal_id: schedule.id }));
    };

    // Calculate totals
    const totalStudents = schedule.peserta_ujians.length;
    const totalHadir = Object.values(form.data.attendance).filter(v => v === 'hadir').length;
    const totalAbsen = Object.values(form.data.attendance).filter(v => v === 'absen').length;

    return (
        <AuthenticatedLayout subtitle="Sistem Informasi Berita Acara Ujian">
            <Head title="Input Berita Acara Ujian (BAU) - BERITA UJIAN" />

            <div style={{ marginBottom: '20px' }}>
                <Link href={route('dosen.berita-acara')} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ textDecoration: 'none' }}>← Batal</Link>
            </div>

            {/* Input Header Panel (Gambar 3.9) */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                    INPUT BERITA ACARA UJIAN (BAU)
                </h3>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', fontSize: '10pt', color: 'var(--text-main)' }}>
                    <div>
                        <strong>Mata Kuliah:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.mata_kuliah.nama_mk}</span>
                    </div>
                    <div>
                        <strong>Kelas:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.kelas}</span>
                    </div>
                    <div>
                        <strong>Tanggal:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.tanggal}</span>
                    </div>
                    <div>
                        <strong>Ruang:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.ruang}</span>
                    </div>
                    {schedule.token && (
                        <div>
                            <strong>Token Absen Mahasiswa:</strong> <span style={{ marginLeft: '6px', fontWeight: '800', fontSize: '11.5pt', color: '#1e3a8a', background: '#dbeafe', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>{schedule.token}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actual Times Card */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px' }}>WAKTU AKTUAL PELAKSANAAN</h3>
                <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="sibau-label">Jam Mulai Ujian</label>
                        <input 
                            type="time" 
                            className="sibau-input" 
                            value={form.data.jam_mulai_aktual} 
                            onChange={e => form.setData('jam_mulai_aktual', e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="sibau-label">Jam Selesai Ujian</label>
                        <input 
                            type="time" 
                            className="sibau-input" 
                            value={form.data.jam_selesai_aktual} 
                            onChange={e => form.setData('jam_selesai_aktual', e.target.value)} 
                            required 
                        />
                    </div>
                </div>
            </div>

            {/* Split Tables: Mahasiswa List & Grades/Signatures (Gambar 3.9 style) */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Daftar Absensi Mahasiswa Ujian
                </h3>

                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5%', textAlign: 'center' }}>No</th>
                                <th style={{ width: '15%' }}>NPM / NIM</th>
                                <th style={{ width: '65%' }}>Nama Mahasiswa</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.peserta_ujians.map((peserta, idx) => {
                                const nim = peserta.nim;
                                const currentStatus = form.data.attendance[nim];
                                return (
                                    <tr key={nim}>
                                        <td className="text-center">{idx + 1}.</td>
                                        <td style={{ fontFamily: 'monospace' }}>{nim}</td>
                                        <td style={{ fontWeight: '600' }}>{peserta.mahasiswa.nama}</td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                {currentStatus === 'hadir' ? (
                                                    <span style={{ 
                                                        fontSize: '9.5pt', 
                                                        color: '#16a34a', 
                                                        background: 'rgba(22, 163, 74, 0.1)', 
                                                        padding: '4px 12px', 
                                                        borderRadius: '6px',
                                                        fontWeight: '700',
                                                        border: '1px solid rgba(22, 163, 74, 0.2)'
                                                    }}>
                                                        Hadir
                                                    </span>
                                                ) : (
                                                    <span style={{ 
                                                        fontSize: '9.5pt', 
                                                        color: '#dc2626', 
                                                        background: 'rgba(220, 38, 38, 0.1)', 
                                                        padding: '4px 12px', 
                                                        borderRadius: '6px',
                                                        fontWeight: '700',
                                                        border: '1px solid rgba(220, 38, 38, 0.2)'
                                                    }}>
                                                        Alpha
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes & Catatan Pelaksanaan */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>CATATAN PELAKSANAAN UJIAN</h3>
                <textarea 
                    className="sibau-textarea" 
                    placeholder="Tuliskan catatan kejadian penting selama ujian berlangsung..." 
                    value={form.data.catatan} 
                    onChange={e => form.setData('catatan', e.target.value)} 
                    style={{ minHeight: '100px' }}
                />
            </div>

            {/* Footer Statistics & Kirim Buttons (Gambar 3.9) */}
            <div className="sibau-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '24px', fontSize: '10pt', fontWeight: '700' }}>
                    <div>JUMLAH MAHASISWA: <span style={{ color: 'var(--text-main)', fontSize: '11pt' }}>{totalStudents}</span></div>
                    <div>HADIR: <span style={{ color: '#16a34a', fontSize: '11pt' }}>{totalHadir}</span></div>
                    <div>ALPHA: <span style={{ color: '#dc2626', fontSize: '11pt' }}>{totalAbsen}</span></div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        type="button" 
                        onClick={() => submit('draft')} 
                        className="sibau-btn sibau-btn-secondary"
                        disabled={form.processing}
                    >
                        Simpan Draft
                    </button>
                    <button 
                        type="button" 
                        onClick={() => submit('menunggu_validasi')} 
                        className="sibau-btn sibau-btn-primary"
                        disabled={form.processing}
                    >
                        KIRIM BERITA ACARA
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
