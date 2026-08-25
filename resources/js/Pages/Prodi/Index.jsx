import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Index({ prodis }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProdi, setEditingProdi] = useState(null);
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [selectedProdi, setSelectedProdi] = useState(null);
    const [newClassName, setNewClassName] = useState('');

    const form = useForm({
        kode_prodi: '',
        nama_prodi: '',
        fakultas: 'Fakultas Ekonomi',
        status: 'aktif',
    });

    const classForm = useForm({
        daftar_kelas: [],
    });

    const openClassModal = (prodi) => {
        setSelectedProdi(prodi);
        classForm.setData('daftar_kelas', prodi.daftar_kelas || []);
        classForm.clearErrors();
        setNewClassName('');
        setClassModalOpen(true);
    };

    const handleAddClass = (e) => {
        e.preventDefault();
        const cleaned = newClassName.trim().toUpperCase();
        if (!cleaned) return;
        if (classForm.data.daftar_kelas.includes(cleaned)) {
            alert('Kelas sudah terdaftar!');
            return;
        }
        classForm.setData('daftar_kelas', [...classForm.data.daftar_kelas, cleaned]);
        setNewClassName('');
    };

    const handleDeleteClass = (clsName) => {
        classForm.setData('daftar_kelas', classForm.data.daftar_kelas.filter(c => c !== clsName));
    };

    const handleSaveClasses = (e) => {
        e.preventDefault();
        classForm.put(route('admin.prodi.updateKelas', { kode_prodi: selectedProdi.kode_prodi }), {
            onSuccess: () => {
                setClassModalOpen(false);
                setSelectedProdi(null);
            }
        });
    };

    const openAdd = () => {
        setEditingProdi(null);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (prodi) => {
        setEditingProdi(prodi);
        form.setData({
            kode_prodi: prodi.kode_prodi,
            nama_prodi: prodi.nama_prodi,
            fakultas: prodi.fakultas,
            status: prodi.status,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingProdi) {
            form.put(route('admin.prodi.update', { kode_prodi: editingProdi.kode_prodi }), {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            form.post(route('admin.prodi.store'), {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const deleteProdi = (kode_prodi) => {
        if (confirm('Apakah Anda yakin ingin menghapus Program Studi ini?')) {
            form.delete(route('admin.prodi.delete', { kode_prodi: kode_prodi }));
        }
    };

    return (
        <AuthenticatedLayout subtitle="Kelola Program Studi Fakultas Ekonomi">
            <Head title="Manajemen Program Studi - BERITA UJIAN" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button onClick={openAdd} className="sibau-btn sibau-btn-primary">+ Tambah Prodi</button>
            </div>

            {/* Grid Cards Program Studi */}
            <div className="sibau-prodi-grid">
                {prodis.map((p) => (
                    <div key={p.kode_prodi} className="sibau-card sibau-prodi-card" style={{ position: 'relative' }}>
                        <div className="sibau-prodi-code">{p.kode_prodi}</div>
                        
                        <div>
                            <div className={`sibau-badge ${p.status === 'aktif' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '12px' }}>
                                {p.status}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '13pt', fontWeight: '800', maxWidth: '80%' }}>{p.nama_prodi}</h3>
                            <div style={{ fontSize: '9pt', color: 'var(--text-muted)', marginTop: '4px' }}>{p.fakultas}</div>
                            
                            {/* Daftar Kelas */}
                            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {(p.daftar_kelas && p.daftar_kelas.length > 0) ? p.daftar_kelas.map(cls => (
                                    <span key={cls} className="sibau-badge badge-info" style={{ fontSize: '7.5pt', padding: '2px 6px' }}>
                                        {cls}
                                    </span>
                                )) : (
                                    <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada kelas terdaftar</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '9.5pt', color: 'var(--text-muted)' }}>
                                <div>📖 <strong style={{ fontWeight: '700' }}>{p.total_mk}</strong> MK</div>
                                <div>👥 <strong style={{ fontWeight: '700' }}>{p.total_mahasiswa}</strong> Mhs</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => openClassModal(p)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '6px 10px', borderColor: 'var(--border-color)' }}>🏫 Kelas</button>
                                <button onClick={() => openEdit(p)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '6px 10px' }}>Edit</button>
                                <button onClick={() => deleteProdi(p.kode_prodi)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '6px 10px' }}>Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Add/Edit Prodi */}
            {modalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">{editingProdi ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}</h3>
                            <button onClick={() => setModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submit}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Kode Prodi (e.g. AKT, MNJ)</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={form.data.kode_prodi} 
                                        onChange={e => form.setData('kode_prodi', e.target.value)} 
                                        disabled={editingProdi !== null}
                                        required 
                                    />
                                    {form.errors.kode_prodi && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.kode_prodi}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Nama Program Studi</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={form.data.nama_prodi} 
                                        onChange={e => form.setData('nama_prodi', e.target.value)} 
                                        required 
                                    />
                                    {form.errors.nama_prodi && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.nama_prodi}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Fakultas</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={form.data.fakultas} 
                                        onChange={e => form.setData('fakultas', e.target.value)} 
                                        required 
                                    />
                                </div>
                                {editingProdi && (
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Status Keaktifan</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: 'aktif', label: 'Aktif' },
                                                { value: 'nonaktif', label: 'Nonaktif' }
                                            ]}
                                            value={form.data.status} 
                                            onChange={e => form.setData('status', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={form.processing} className="sibau-btn sibau-btn-primary">
                                    {editingProdi ? 'Simpan Perubahan' : 'Tambah Prodi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Kelola Kelas */}
            {classModalOpen && selectedProdi && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal" style={{ maxWidth: '450px' }}>
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">🏫 Kelola Kelas - {selectedProdi.nama_prodi}</h3>
                            <button onClick={() => setClassModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <div className="sibau-modal-body">
                            {/* Form Tambah Kelas */}
                            <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <input 
                                    type="text" 
                                    className="sibau-input" 
                                    placeholder="Contoh: MI-A23, KA-A23"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    required
                                />
                                <button type="submit" className="sibau-btn sibau-btn-primary">+ Tambah</button>
                            </form>

                            {/* Daftar Kelas Saat Ini */}
                            <div style={{ fontWeight: '600', fontSize: '9pt', color: 'var(--text-muted)', marginBottom: '8px' }}>Daftar Kelas Terdaftar:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
                                {classForm.data.daftar_kelas.length > 0 ? classForm.data.daftar_kelas.map(clsName => (
                                    <div key={clsName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px', fontSize: '9.5pt', fontWeight: '600' }}>
                                        <span>{clsName}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => handleDeleteClass(clsName)} 
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '11pt' }}
                                            title="Hapus Kelas"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )) : (
                                    <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '9pt', textAlign: 'center', padding: '12px' }}>Belum ada kelas. Masukkan kode kelas di atas.</div>
                                )}
                            </div>
                        </div>
                        <div className="sibau-modal-footer">
                            <button type="button" onClick={() => setClassModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                            <button 
                                type="button" 
                                onClick={handleSaveClasses} 
                                disabled={classForm.processing} 
                                className="sibau-btn sibau-btn-primary"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
