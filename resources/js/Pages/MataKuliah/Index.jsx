import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Index({ courses, prodis }) {
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const importForm = useForm({
        excel_file: null,
    });

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('admin.matakuliah.import'), {
            onSuccess: () => {
                setImportModalOpen(false);
                importForm.reset();
            },
        });
    };

    const form = useForm({
        kode_mk: '',
        nama_mk: '',
        sks: 3,
        kode_prodi: prodis[0]?.kode_prodi || '',
        semester: 1,
        status: 'aktif',
        teori: true,
        praktek: false,
    });

    const openAdd = () => {
        setEditingCourse(null);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const openEdit = (course) => {
        setEditingCourse(course);
        form.setData({
            kode_mk: course.kode_mk,
            nama_mk: course.nama_mk,
            sks: course.sks,
            kode_prodi: course.kode_prodi,
            semester: course.semester,
            status: course.status,
            teori: !!course.teori,
            praktek: !!course.praktek,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingCourse) {
            form.put(route('admin.matakuliah.update', { kode_mk: editingCourse.kode_mk }), {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            form.post(route('admin.matakuliah.store'), {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const deleteCourse = (kode_mk) => {
        if (confirm('Apakah Anda yakin ingin menghapus Mata Kuliah ini?')) {
            form.delete(route('admin.matakuliah.delete', { kode_mk: kode_mk }));
        }
    };

    const filteredCourses = courses.filter(c => 
        c.nama_mk.toLowerCase().includes(search.toLowerCase()) || 
        c.kode_mk.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout subtitle="Kelola Kurikulum & Daftar Mata Kuliah">
            <Head title="Manajemen Mata Kuliah - SIBAU" />
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
                        <input 
                            type="text" 
                            className="sibau-input" 
                            placeholder="Cari nama atau kode mata kuliah..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setImportModalOpen(true)} className="sibau-btn sibau-btn-secondary">📁 Import Excel</button>
                        <button onClick={openAdd} className="sibau-btn sibau-btn-primary">+ Tambah Mata Kuliah</button>
                    </div>
                </div>
            </div>

            {/* List Mata Kuliah */}
            <div className="sibau-card">
                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Kode MK</th>
                                <th style={{ width: '40%' }}>Nama Mata Kuliah</th>
                                <th style={{ width: '10%' }} className="text-center">SKS</th>
                                <th style={{ width: '15%' }}>Program Studi</th>
                                <th style={{ width: '10%' }} className="text-center">Semester</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '10%' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map((c) => (
                                <tr key={c.kode_mk}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{c.kode_mk}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{c.nama_mk}</div>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                            {!!c.teori && <span className="sibau-badge badge-info" style={{ fontSize: '7.5pt', padding: '1px 5px' }}>Teori</span>}
                                            {!!c.praktek && <span className="sibau-badge badge-warning" style={{ fontSize: '7.5pt', padding: '1px 5px' }}>Praktek</span>}
                                        </div>
                                    </td>
                                    <td className="text-center">{c.sks} SKS</td>
                                    <td>{c.program_studi?.nama_prodi || c.kode_prodi}</td>
                                    <td className="text-center">Sem. {c.semester}</td>
                                    <td>
                                        <span className={`sibau-badge ${c.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => openEdit(c)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '6px 8px' }}>✏️</button>
                                            <button onClick={() => deleteCourse(c.kode_mk)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '6px 8px' }}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCourses.length === 0 && (
                                <tr>
                                    <td colspan="7" className="text-center" style={{ color: 'var(--text-muted)' }}>Mata kuliah tidak ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add/Edit Mata Kuliah */}
            {modalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">{editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}</h3>
                            <button onClick={() => setModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submit}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Kode Mata Kuliah (e.g. MAK101)</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={form.data.kode_mk} 
                                        onChange={e => form.setData('kode_mk', e.target.value)} 
                                        disabled={editingCourse !== null}
                                        required 
                                    />
                                    {form.errors.kode_mk && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.kode_mk}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Nama Mata Kuliah</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={form.data.nama_mk} 
                                        onChange={e => form.setData('nama_mk', e.target.value)} 
                                        required 
                                    />
                                    {form.errors.nama_mk && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.nama_mk}</div>}
                                </div>
                                <div className="sibau-form-group" style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="sibau-label">Jumlah SKS</label>
                                        <input 
                                            type="number" 
                                            className="sibau-input" 
                                            value={form.data.sks} 
                                            onChange={e => form.setData('sks', parseInt(e.target.value))} 
                                            min="1" 
                                            max="6" 
                                            required 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="sibau-label">Semester</label>
                                        <input 
                                            type="number" 
                                            className="sibau-input" 
                                            value={form.data.semester} 
                                            onChange={e => form.setData('semester', parseInt(e.target.value))} 
                                            min="1" 
                                            max="8" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Program Studi</label>
                                    <SearchableSelect 
                                        options={prodis.map(p => ({ value: p.kode_prodi, label: p.nama_prodi }))}
                                        value={form.data.kode_prodi} 
                                        onChange={e => form.setData('kode_prodi', e.target.value)}
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Tipe Mata Kuliah</label>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '9.5pt', fontWeight: '500' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={form.data.teori} 
                                                onChange={e => form.setData('teori', e.target.checked)} 
                                            />
                                            Teori
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '9.5pt', fontWeight: '500' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={form.data.praktek} 
                                                onChange={e => form.setData('praktek', e.target.checked)} 
                                            />
                                            Praktek
                                        </label>
                                    </div>
                                    {form.errors.teori && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.teori}</div>}
                                </div>
                                {editingCourse && (
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Status</label>
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
                                    {editingCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Import Mata Kuliah */}
            {importModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Import Mata Kuliah dari Excel</h3>
                            <button onClick={() => setImportModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitImport}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Pilih Berkas Excel (.xlsx, .xls)</label>
                                    <input 
                                        type="file" 
                                        className="sibau-input" 
                                        onChange={e => importForm.setData('excel_file', e.target.files[0])}
                                        required 
                                    />
                                    {importForm.errors.excel_file && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{importForm.errors.excel_file}</div>}
                                    <div style={{ marginTop: '8px' }}>
                                        <a href={route('admin.templates.download', { type: 'matakuliah' })} style={{ fontSize: '9pt', color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '600' }}>
                                            📥 Unduh Template Excel Mata Kuliah
                                        </a>
                                    </div>
                                </div>
                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    💡 <strong>Info Format Kolom Excel:</strong><br />
                                    Data harus berada pada Sheet pertama dengan format kolom:<br />
                                    <strong>A: Kode MK, B: Nama Mata Kuliah, C: Jumlah SKS, D: Kode Prodi (e.g. AKT, MNJ), E: Semester, F: Teori (Ya/Tidak), G: Praktek (Ya/Tidak)</strong><br />
                                    <span style={{ fontSize: '8pt', color: '#64748b' }}>* Baris pertama diasumsikan sebagai Header (dilewati saat impor).</span>
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setImportModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={importForm.processing} className="sibau-btn sibau-btn-primary">Unggah & Import</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
