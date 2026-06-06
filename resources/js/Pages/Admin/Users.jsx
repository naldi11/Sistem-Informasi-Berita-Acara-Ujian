import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Users({ dosens, mahasiswas, prodis, courses = [] }) {
    const [dosenSearch, setDosenSearch] = useState('');
    const [mahasiswaSearch, setMahasiswaSearch] = useState('');
    const [activeTab, setActiveTab] = useState('dosen');

    const [dosenModalOpen, setDosenModalOpen] = useState(false);
    const [mahasiswaModalOpen, setMahasiswaModalOpen] = useState(false);
    const [importDosenOpen, setImportDosenOpen] = useState(false);
    const [importMahasiswaOpen, setImportMahasiswaOpen] = useState(false);
    const [editingDosen, setEditingDosen] = useState(null);
    const [editingMahasiswa, setEditingMahasiswa] = useState(null);

    const importDosenForm = useForm({
        excel_file: null,
    });

    const importMahasiswaForm = useForm({
        excel_file: null,
    });

    // Dosen Form
    const dosenForm = useForm({
        nip: '',
        nama: '',
        kode_prodi: prodis[0]?.kode_prodi || '',
        jabatan: 'Lektor',
        email: '',
        password: '',
        status: 'aktif',
        ampu_mata_kuliah: [],
        ampu_kelas: [],
    });

    // Mahasiswa Form
    const mahasiswaForm = useForm({
        nim: '',
        nama: '',
        kode_prodi: prodis[0]?.kode_prodi || '',
        angkatan: new Date().getFullYear().toString(),
        kelas: '',
        status: 'aktif',
    });

    const openAddDosen = () => {
        setEditingDosen(null);
        dosenForm.reset();
        dosenForm.clearErrors();
        setDosenModalOpen(true);
    };

    const openEditDosen = (dosen) => {
        setEditingDosen(dosen);
        dosenForm.setData({
            nip: dosen.nip,
            nama: dosen.nama,
            kode_prodi: dosen.kode_prodi,
            jabatan: dosen.jabatan || 'Lektor',
            email: dosen.user?.email || '',
            password: '',
            status: dosen.status,
            ampu_mata_kuliah: dosen.ampu_mata_kuliah || [],
            ampu_kelas: dosen.ampu_kelas || [],
        });
        dosenForm.clearErrors();
        setDosenModalOpen(true);
    };

    const openAddMahasiswa = () => {
        setEditingMahasiswa(null);
        mahasiswaForm.reset();
        mahasiswaForm.clearErrors();
        setMahasiswaModalOpen(true);
    };

    const openEditMahasiswa = (mhs) => {
        setEditingMahasiswa(mhs);
        mahasiswaForm.setData({
            nim: mhs.nim,
            nama: mhs.nama,
            kode_prodi: mhs.kode_prodi,
            angkatan: mhs.angkatan,
            kelas: mhs.kelas || '',
            status: mhs.status,
        });
        mahasiswaForm.clearErrors();
        setMahasiswaModalOpen(true);
    };

    const submitDosen = (e) => {
        e.preventDefault();
        if (editingDosen) {
            dosenForm.put(route('admin.users.updateDosen', { nip: editingDosen.nip }), {
                onSuccess: () => setDosenModalOpen(false),
            });
        } else {
            dosenForm.post(route('admin.users.storeDosen'), {
                onSuccess: () => setDosenModalOpen(false),
            });
        }
    };

    const submitMahasiswa = (e) => {
        e.preventDefault();
        if (editingMahasiswa) {
            mahasiswaForm.put(route('admin.users.updateMahasiswa', { nim: editingMahasiswa.nim }), {
                onSuccess: () => setMahasiswaModalOpen(false),
            });
        } else {
            mahasiswaForm.post(route('admin.users.storeMahasiswa'), {
                onSuccess: () => setMahasiswaModalOpen(false),
            });
        }
    };

    const submitImportDosen = (e) => {
        e.preventDefault();
        importDosenForm.post(route('admin.users.importDosen'), {
            onSuccess: () => {
                setImportDosenOpen(false);
                importDosenForm.reset();
            },
        });
    };

    const submitImportMahasiswa = (e) => {
        e.preventDefault();
        importMahasiswaForm.post(route('admin.users.importMahasiswa'), {
            onSuccess: () => {
                setImportMahasiswaOpen(false);
                importMahasiswaForm.reset();
            },
        });
    };

    const deleteDosen = (nip) => {
        if (confirm('Apakah Anda yakin ingin menghapus dosen ini? User account terkait juga akan terhapus.')) {
            dosenForm.delete(route('admin.users.deleteDosen', { nip: nip }));
        }
    };

    const deleteMahasiswa = (nim) => {
        if (confirm('Apakah Anda yakin ingin menghapus mahasiswa ini?')) {
            mahasiswaForm.delete(route('admin.users.deleteMahasiswa', { nim: nim }));
        }
    };

    // Filters
    const filteredDosens = dosens.filter(d => 
        d.nama.toLowerCase().includes(dosenSearch.toLowerCase()) || 
        d.nip.includes(dosenSearch)
    );

    const filteredMahasiswas = mahasiswas.filter(m => 
        m.nama.toLowerCase().includes(mahasiswaSearch.toLowerCase()) || 
        m.nim.includes(mahasiswaSearch)
    );

    const allProdiClasses = prodis.flatMap(p => p.daftar_kelas || []);
    const classOptions = Array.from(new Set(allProdiClasses)).filter(Boolean).sort();

    return (
        <AuthenticatedLayout subtitle="Manajemen Dosen & Mahasiswa">
            <Head title="Kelola Dosen & Mahasiswa - SIBAU" />
            <div className="sibau-tabs-container">
                <button 
                    onClick={() => setActiveTab('dosen')}
                    className={`sibau-tab-btn ${activeTab === 'dosen' ? 'active' : ''}`}
                >
                    👨‍🏫 Dosen
                </button>
                <button 
                    onClick={() => setActiveTab('mahasiswa')}
                    className={`sibau-tab-btn ${activeTab === 'mahasiswa' ? 'active' : ''}`}
                >
                    🎓 Mahasiswa
                </button>
            </div>

            {activeTab === 'dosen' && (
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👨‍🏫 Manajemen Dosen</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setImportDosenOpen(true)} className="sibau-btn sibau-btn-secondary sibau-btn-sm">📁 Import Dosen</button>
                            <button onClick={openAddDosen} className="sibau-btn sibau-btn-primary sibau-btn-sm">+ Tambah Dosen</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <input 
                            type="text" 
                            className="sibau-input" 
                            placeholder="Cari Dosen (NIP / Nama)..." 
                            value={dosenSearch}
                            onChange={(e) => setDosenSearch(e.target.value)}
                        />
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th>NIP</th>
                                    <th>Nama Dosen</th>
                                    <th>Jabatan</th>
                                    <th>Prodi</th>
                                    <th>Mata Kuliah Diampu</th>
                                    <th>Kelas</th>
                                    <th>Status</th>
                                    <th style={{ width: '80px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDosens.map((d) => {
                                    const ampuMK = Array.isArray(d.ampu_mata_kuliah) ? d.ampu_mata_kuliah : [];
                                    const ampuKelas = Array.isArray(d.ampu_kelas) ? d.ampu_kelas : [];
                                    return (
                                        <tr key={d.nip}>
                                            <td style={{ fontFamily: 'monospace' }}>{d.nip}</td>
                                            <td style={{ fontWeight: '600' }}>{d.nama}</td>
                                            <td>{d.jabatan || 'Lektor'}</td>
                                            <td>{d.program_studi?.nama_prodi || d.kode_prodi}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
                                                    {ampuMK.length > 0 ? ampuMK.map(mk => {
                                                        const c = courses.find(item => item.kode_mk === mk);
                                                        return (
                                                            <span key={mk} className="sibau-badge badge-info" style={{ fontSize: '7.5pt', padding: '1px 4px' }} title={c ? c.nama_mk : mk}>
                                                                {mk}
                                                            </span>
                                                        );
                                                    }) : <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>-</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {ampuKelas.length > 0 ? ampuKelas.map(k => (
                                                        <span key={k} className="sibau-badge badge-warning" style={{ fontSize: '7.5pt', padding: '1px 4px' }}>
                                                            {k}
                                                        </span>
                                                    )) : <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>-</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`sibau-badge ${d.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => openEditDosen(d)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '4px 8px' }}>✏️</button>
                                                    <button onClick={() => deleteDosen(d.nip)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '4px 8px' }}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'mahasiswa' && (
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎓 Manajemen Mahasiswa</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setImportMahasiswaOpen(true)} className="sibau-btn sibau-btn-secondary sibau-btn-sm">📁 Import Mahasiswa</button>
                            <button onClick={openAddMahasiswa} className="sibau-btn sibau-btn-primary sibau-btn-sm">+ Tambah Mahasiswa</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <input 
                            type="text" 
                            className="sibau-input" 
                            placeholder="Cari Mahasiswa (NIM / Nama)..." 
                            value={mahasiswaSearch}
                            onChange={(e) => setMahasiswaSearch(e.target.value)}
                        />
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th>NIM</th>
                                    <th>Nama Mahasiswa</th>
                                    <th>Prodi</th>
                                    <th>Angkatan</th>
                                    <th>Kelas</th>
                                    <th>Status</th>
                                    <th style={{ width: '80px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMahasiswas.map((m) => (
                                    <tr key={m.nim}>
                                        <td style={{ fontFamily: 'monospace' }}>{m.nim}</td>
                                        <td style={{ fontWeight: '600' }}>{m.nama}</td>
                                        <td>{m.program_studi?.nama_prodi || m.kode_prodi}</td>
                                        <td className="text-center">{m.angkatan}</td>
                                        <td className="text-center" style={{ fontWeight: '700' }}>{m.kelas || '-'}</td>
                                        <td>
                                            <span className={`sibau-badge ${m.status === 'aktif' ? 'badge-success' : m.status === 'cuti' ? 'badge-warning' : 'badge-danger'}`}>
                                                {m.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => openEditMahasiswa(m)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '4px 8px' }}>✏️</button>
                                                <button onClick={() => deleteMahasiswa(m.nim)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '4px 8px' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Dosen */}
            {dosenModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">{editingDosen ? 'Edit Data Dosen' : 'Tambah Dosen Baru'}</h3>
                            <button onClick={() => setDosenModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitDosen}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">NIP</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={dosenForm.data.nip} 
                                        onChange={e => dosenForm.setData('nip', e.target.value)} 
                                        disabled={editingDosen !== null}
                                        required 
                                    />
                                    {dosenForm.errors.nip && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{dosenForm.errors.nip}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={dosenForm.data.nama} 
                                        onChange={e => dosenForm.setData('nama', e.target.value)} 
                                        required 
                                    />
                                    {dosenForm.errors.nama && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{dosenForm.errors.nama}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Program Studi</label>
                                    <SearchableSelect 
                                        options={prodis.map(p => ({ value: p.kode_prodi, label: p.nama_prodi }))}
                                        value={dosenForm.data.kode_prodi} 
                                        onChange={e => {
                                            dosenForm.setData(data => ({
                                                ...data,
                                                kode_prodi: e.target.value,
                                                ampu_kelas: []
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Jabatan Akademik</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={dosenForm.data.jabatan} 
                                        onChange={e => dosenForm.setData('jabatan', e.target.value)} 
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Mata Kuliah yang Diampu (Multi-select)</label>
                                    <SearchableSelect 
                                        options={courses.map(c => ({ value: c.kode_mk, label: `${c.nama_mk} (${c.kode_mk})` }))}
                                        value={dosenForm.data.ampu_mata_kuliah} 
                                        onChange={e => dosenForm.setData('ampu_mata_kuliah', e.target.value)}
                                        multiple={true}
                                        placeholder="Pilih mata kuliah..."
                                    />
                                    {dosenForm.errors.ampu_mata_kuliah && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{dosenForm.errors.ampu_mata_kuliah}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Kelas yang Diampu (Multi-select)</label>
                                    <SearchableSelect 
                                        options={
                                            (() => {
                                                const p = prodis.find(item => item.kode_prodi === dosenForm.data.kode_prodi);
                                                const kls = p?.daftar_kelas || [];
                                                return kls.map(k => ({ value: k, label: `Kelas ${k}` }));
                                            })()
                                        }
                                        value={dosenForm.data.ampu_kelas} 
                                        onChange={e => dosenForm.setData('ampu_kelas', e.target.value)}
                                        multiple={true}
                                        placeholder="Pilih kelas..."
                                    />
                                    {dosenForm.errors.ampu_kelas && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{dosenForm.errors.ampu_kelas}</div>}
                                </div>
                                {!editingDosen && (
                                    <>
                                        <div className="sibau-form-group">
                                            <label className="sibau-label">Email Akun</label>
                                            <input 
                                                type="email" 
                                                className="sibau-input" 
                                                value={dosenForm.data.email} 
                                                onChange={e => dosenForm.setData('email', e.target.value)} 
                                                required 
                                            />
                                            {dosenForm.errors.email && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{dosenForm.errors.email}</div>}
                                        </div>
                                        <div className="sibau-form-group">
                                            <label className="sibau-label">Kata Sandi</label>
                                            <input 
                                                type="password" 
                                                className="sibau-input" 
                                                value={dosenForm.data.password} 
                                                onChange={e => dosenForm.setData('password', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </>
                                )}
                                {editingDosen && (
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Status Keaktifan</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: 'aktif', label: 'Aktif' },
                                                { value: 'nonaktif', label: 'Nonaktif' }
                                            ]}
                                            value={dosenForm.data.status} 
                                            onChange={e => dosenForm.setData('status', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setDosenModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={dosenForm.processing} className="sibau-btn sibau-btn-primary">
                                    {editingDosen ? 'Simpan Perubahan' : 'Tambah Dosen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Mahasiswa */}
            {mahasiswaModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">{editingMahasiswa ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}</h3>
                            <button onClick={() => setMahasiswaModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitMahasiswa}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">NIM / NPM</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={mahasiswaForm.data.nim} 
                                        onChange={e => mahasiswaForm.setData('nim', e.target.value)} 
                                        disabled={editingMahasiswa !== null}
                                        required 
                                    />
                                    {mahasiswaForm.errors.nim && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{mahasiswaForm.errors.nim}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Nama Mahasiswa</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={mahasiswaForm.data.nama} 
                                        onChange={e => mahasiswaForm.setData('nama', e.target.value)} 
                                        required 
                                    />
                                    {mahasiswaForm.errors.nama && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{mahasiswaForm.errors.nama}</div>}
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Program Studi</label>
                                    <SearchableSelect 
                                        options={prodis.map(p => ({ value: p.kode_prodi, label: p.nama_prodi }))}
                                        value={mahasiswaForm.data.kode_prodi} 
                                        onChange={e => {
                                            mahasiswaForm.setData(data => ({
                                                ...data,
                                                kode_prodi: e.target.value,
                                                kelas: ''
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Angkatan</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={mahasiswaForm.data.angkatan} 
                                        onChange={e => mahasiswaForm.setData('angkatan', e.target.value)} 
                                        required
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Kelas</label>
                                    <SearchableSelect 
                                        options={
                                            (() => {
                                                const p = prodis.find(item => item.kode_prodi === mahasiswaForm.data.kode_prodi);
                                                const kls = p?.daftar_kelas || [];
                                                return kls.map(k => ({ value: k, label: `Kelas ${k}` }));
                                            })()
                                        }
                                        value={mahasiswaForm.data.kelas} 
                                        onChange={e => mahasiswaForm.setData('kelas', e.target.value)}
                                        placeholder="Pilih kelas..."
                                    />
                                    {mahasiswaForm.errors.kelas && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{mahasiswaForm.errors.kelas}</div>}
                                </div>
                                {editingMahasiswa && (
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Status</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: 'aktif', label: 'Aktif' },
                                                { value: 'cuti', label: 'Cuti' },
                                                { value: 'nonaktif', label: 'Nonaktif' }
                                            ]}
                                            value={mahasiswaForm.data.status} 
                                            onChange={e => mahasiswaForm.setData('status', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setMahasiswaModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={mahasiswaForm.processing} className="sibau-btn sibau-btn-primary">
                                    {editingMahasiswa ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Import Dosen */}
            {importDosenOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Import Dosen dari Excel</h3>
                            <button onClick={() => setImportDosenOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitImportDosen}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Pilih Berkas Excel (.xlsx, .xls)</label>
                                    <input 
                                        type="file" 
                                        className="sibau-input" 
                                        onChange={e => importDosenForm.setData('excel_file', e.target.files[0])}
                                        required 
                                    />
                                    {importDosenForm.errors.excel_file && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{importDosenForm.errors.excel_file}</div>}
                                    <div style={{ marginTop: '8px' }}>
                                        <a href={route('admin.templates.download', { type: 'dosen' })} style={{ fontSize: '9pt', color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '600' }}>
                                            📥 Unduh Template Excel Dosen
                                        </a>
                                    </div>
                                </div>
                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    💡 <strong>Info Format Kolom Excel:</strong><br />
                                    Data harus berada pada Sheet pertama dengan format kolom:<br />
                                    <strong>A: NIP, B: Nama Dosen, C: Kode Prodi (e.g. AKT, MNJ), D: Jabatan Akademik, E: Email (Opsional), F: Mata Kuliah Diampu (Kode MK, pisah koma), G: Kelas Diampu (pisah koma)</strong><br />
                                    <span style={{ fontSize: '8pt', color: '#64748b' }}>* Baris pertama diasumsikan sebagai Header (dilewati saat impor). Akun user dosen akan otomatis dibuat dengan password default <code>password123</code>.</span>
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setImportDosenOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={importDosenForm.processing} className="sibau-btn sibau-btn-primary">Unggah & Import</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Mahasiswa */}
            {importMahasiswaOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Import Mahasiswa dari Excel</h3>
                            <button onClick={() => setImportMahasiswaOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitImportMahasiswa}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Pilih Berkas Excel (.xlsx, .xls)</label>
                                    <input 
                                        type="file" 
                                        className="sibau-input" 
                                        onChange={e => importMahasiswaForm.setData('excel_file', e.target.files[0])}
                                        required 
                                    />
                                    {importMahasiswaForm.errors.excel_file && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{importMahasiswaForm.errors.excel_file}</div>}
                                    <div style={{ marginTop: '8px' }}>
                                        <a href={route('admin.templates.download', { type: 'mahasiswa' })} style={{ fontSize: '9pt', color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '600' }}>
                                            📥 Unduh Template Excel Mahasiswa
                                        </a>
                                    </div>
                                </div>
                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    💡 <strong>Info Format Kolom Excel:</strong><br />
                                    Data harus berada pada Sheet pertama dengan format kolom:<br />
                                    <strong>A: NIM/NPM, B: Nama Mahasiswa, C: Kode Prodi (e.g. AKT, MNJ), D: Angkatan, E: Kelas (Opsional)</strong><br />
                                    <span style={{ fontSize: '8pt', color: '#64748b' }}>* Baris pertama diasumsikan sebagai Header (dilewati saat impor).</span>
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setImportMahasiswaOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={importMahasiswaForm.processing} className="sibau-btn sibau-btn-primary">Unggah & Import</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
