import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Jadwal({ schedules }) {
    const [search, setSearch] = useState('');

    // Jadwal yang sedang diajukan penggantinya. Diisi dari baris yang tombolnya
    // diklik, sehingga dosen tidak perlu memilih jadwal lagi di dalam formulir.
    const [gantiTarget, setGantiTarget] = useState(null);

    const gantiForm = useForm({ alasan: '' });

    const bukaGanti = (jadwal) => {
        gantiForm.reset();
        gantiForm.clearErrors();
        setGantiTarget(jadwal);
    };

    const kirimGanti = (e) => {
        e.preventDefault();
        gantiForm.post(
            route('dosen.jadwal.permohonan-penggantian', { jadwal: gantiTarget.id }),
            {
                preserveScroll: true,
                onSuccess: () => setGantiTarget(null),
            },
        );
    };

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
                                                        {(() => {
                                                            const permohonan = s.permohonan_ganti_terakhir;

                                                            if (permohonan?.status === 'pending') {
                                                                return (
                                                                    <span className="sibau-badge badge-warning" style={{ fontSize: '8pt', textAlign: 'center', padding: '6px 10px' }}>
                                                                        Menunggu Konfirmasi Admin
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <>
                                                                    {permohonan?.status === 'ditolak' && (
                                                                        <span className="sibau-badge badge-danger" style={{ fontSize: '7.5pt', textAlign: 'center' }}>
                                                                            Permohonan ditolak
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => bukaGanti(s)}
                                                                        className="sibau-btn sibau-btn-secondary sibau-btn-sm"
                                                                        style={{ padding: '6px 10px', width: '100%', textAlign: 'center' }}
                                                                    >
                                                                        Ajukan Pengganti
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
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

            {/* Modal pengajuan pengganti; jadwalnya sudah terkunci dari baris yang diklik */}
            {gantiTarget && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal" style={{ maxWidth: '560px' }}>
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Ajukan Penggantian Pengawas</h3>
                            <button type="button" onClick={() => setGantiTarget(null)} className="sibau-modal-close">×</button>
                        </div>

                        <form onSubmit={kirimGanti}>
                            <div className="sibau-modal-body">
                                <div
                                    style={{
                                        background: 'var(--bg-subtle, #f1f5f9)',
                                        borderRadius: '8px',
                                        padding: '14px 16px',
                                        marginBottom: '18px',
                                        fontSize: '9.5pt',
                                        lineHeight: 1.7,
                                    }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '10.5pt', marginBottom: '4px' }}>
                                        {gantiTarget.mata_kuliah?.nama_mk}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        {formatIndoDate(gantiTarget.tanggal)} · {gantiTarget.jam_mulai?.substring(0, 5)} – {gantiTarget.jam_selesai?.substring(0, 5)}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)' }}>
                                        Ruang {gantiTarget.ruang} · Kelas {gantiTarget.kelas} · {gantiTarget.jenis_ujian}
                                    </div>
                                </div>

                                <div className="sibau-form-group">
                                    <label className="sibau-label">Alasan Berhalangan Hadir</label>
                                    <textarea
                                        className="sibau-textarea"
                                        rows={4}
                                        value={gantiForm.data.alasan}
                                        onChange={(e) => gantiForm.setData('alasan', e.target.value)}
                                        placeholder="Tuliskan alasan lengkap mengapa Anda membutuhkan pengawas pengganti (minimal 10 karakter)..."
                                        required
                                    />
                                    {gantiForm.errors.alasan && (
                                        <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>
                                            {gantiForm.errors.alasan}
                                        </div>
                                    )}
                                </div>

                                <p style={{ fontSize: '8.5pt', color: 'var(--text-muted)', margin: 0 }}>
                                    Permohonan dikirim ke admin. Dosen penggantinya ditentukan dan ditugaskan oleh admin
                                    setelah permohonan disetujui.
                                </p>
                            </div>

                            <div className="sibau-modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setGantiTarget(null)}
                                    className="sibau-btn sibau-btn-secondary"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="sibau-btn sibau-btn-primary"
                                    disabled={gantiForm.processing}
                                >
                                    {gantiForm.processing ? 'Mengirim...' : 'Kirim Permohonan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
