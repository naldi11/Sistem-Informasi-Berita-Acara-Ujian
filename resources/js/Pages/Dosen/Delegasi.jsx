import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Delegasi({ schedules, dosens }) {
    const formatIndoDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) { return dateStr; }
    };

    const [delegasiModalOpen, setDelegasiModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const delegasiForm = useForm({
        nip_dosen: '',
    });

    const openDelegasiModal = (schedule) => {
        setSelectedSchedule(schedule);
        delegasiForm.setData('nip_dosen', '');
        setDelegasiModalOpen(true);
    };

    const submitDelegasi = (e) => {
        e.preventDefault();
        delegasiForm.post(route('dosen.jadwal.delegasi', { id: selectedSchedule.id }), {
            onSuccess: () => setDelegasiModalOpen(false),
        });
    };

    return (
        <AuthenticatedLayout subtitle="DELEGASI JADWAL PENGAWAS">
            <Head title="Delegasi Pengawas - BERITA UJIAN" />

            <div className="sibau-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '14pt', fontWeight: '800', color: 'var(--text-main)' }}>JADWAL YANG BISA DIDELEGASIKAN</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '9pt', color: 'var(--text-muted)' }}>Pilih jadwal ujian Anda yang ingin diserahkan kepada dosen pengganti.</p>
                    </div>
                </div>

                {schedules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.5 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>Tidak ada jadwal ujian aktif yang bisa didelegasikan saat ini.</p>
                    </div>
                ) : (
                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                    <th>Mata Kuliah / Kelas</th>
                                    <th>Waktu Ujian</th>
                                    <th>Ruang</th>
                                    <th style={{ textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: '700' }}>{s.mata_kuliah.nama_mk}</div>
                                            <div style={{ fontSize: '9pt', color: 'var(--text-muted)' }}>MK: {s.kode_mk} | Kls: {s.kelas}</div>
                                        </td>
                                        <td>
                                            <div>{formatIndoDate(s.tanggal)}</div>
                                            <div style={{ fontSize: '9pt', color: 'var(--text-muted)' }}>{s.jam_mulai.substring(0, 5)} - {s.jam_selesai.substring(0, 5)} WIB</div>
                                        </td>
                                        <td>{s.ruang}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => openDelegasiModal(s)} 
                                                className="sibau-btn sibau-btn-primary sibau-btn-sm"
                                            >
                                                Pilih Pengganti
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Delegasi Pengawas */}
            {delegasiModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal" style={{ maxWidth: '500px' }}>
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Pilih Dosen Pengganti</h3>
                            <button onClick={() => setDelegasiModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitDelegasi}>
                            <div className="sibau-modal-body">
                                <p style={{ fontSize: '9.5pt', marginBottom: '16px', color: 'var(--text-muted)' }}>
                                    Anda akan mendelegasikan jadwal mengawas ujian mata kuliah <strong>{selectedSchedule?.mata_kuliah?.nama_mk}</strong> kepada dosen lain. Jadwal ini akan hilang dari daftar Anda.
                                </p>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Pilih Dosen Pengganti</label>
                                    <SearchableSelect 
                                        options={dosens.map(d => ({ value: d.nip, label: d.nama }))}
                                        value={delegasiForm.data.nip_dosen} 
                                        onChange={e => delegasiForm.setData('nip_dosen', e.target.value)}
                                    />
                                    {delegasiForm.errors.nip_dosen && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{delegasiForm.errors.nip_dosen}</div>}
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setDelegasiModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={delegasiForm.processing} className="sibau-btn sibau-btn-primary">
                                    {delegasiForm.processing ? 'Menyimpan...' : 'Simpan Delegasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
