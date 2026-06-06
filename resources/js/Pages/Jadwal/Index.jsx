import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Index({ schedules, dosens, courses, mahasiswas, prodis = [] }) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('Semua');
    const [filterStatus, setFilterStatus] = useState('Semua');

    const [jadwalModalOpen, setJadwalModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingJadwal, setEditingJadwal] = useState(null);

    const [studentSearch, setStudentSearch] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('Semua');
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Form for Add/Edit Jadwal
    const form = useForm({
        kode_mk: courses[0]?.kode_mk || '',
        nip_dosen: dosens[0]?.nip || '',
        tanggal: '',
        sesi: '',
        jam_mulai: '08:30',
        jam_selesai: '10:00',
        ruang: '',
        kelas: 'A',
        jenis_ujian: 'UTS',
        semester_aktif: 'Ganjil 2025/2026',
        tahun_akademik: '2025/2026',
        status: 'terjadwal',
        student_nims: [],
    });

    // Form for Excel Import
    const importForm = useForm({
        excel_file: null,
        jenis_ujian: 'UTS',
        semester_aktif: 'Ganjil 2025/2026',
        tahun_akademik: '2025/2026',
    });

    const openAdd = () => {
        setEditingJadwal(null);
        setSelectedStudents([]);
        form.reset();
        form.clearErrors();
        setJadwalModalOpen(true);
    };

    const openEdit = (sched) => {
        setEditingJadwal(sched);
        const studentNims = sched.peserta_ujians.map(p => p.nim);
        setSelectedStudents(studentNims);
        
        form.setData({
            kode_mk: sched.kode_mk,
            nip_dosen: sched.nip_dosen,
            tanggal: sched.tanggal,
            sesi: sched.sesi || '',
            jam_mulai: sched.jam_mulai.substring(0, 5),
            jam_selesai: sched.jam_selesai.substring(0, 5),
            ruang: sched.ruang,
            kelas: sched.kelas,
            jenis_ujian: sched.jenis_ujian,
            semester_aktif: sched.semester_aktif,
            tahun_akademik: sched.tahun_akademik,
            status: sched.status,
            student_nims: studentNims,
        });
        form.clearErrors();
        setJadwalModalOpen(true);
    };

    const handleStudentCheckbox = (nim) => {
        if (selectedStudents.includes(nim)) {
            setSelectedStudents(selectedStudents.filter(id => id !== nim));
        } else {
            setSelectedStudents([...selectedStudents, nim]);
        }
    };

    const selectAllStudents = () => {
        const visibleNims = filteredStudents.map(s => s.nim);
        setSelectedStudents(Array.from(new Set([...selectedStudents, ...visibleNims])));
    };

    const deselectAllStudents = () => {
        const visibleNims = filteredStudents.map(s => s.nim);
        setSelectedStudents(selectedStudents.filter(id => !visibleNims.includes(id)));
    };

    const submitJadwal = (e) => {
        e.preventDefault();
        
        // Load selected students to form data
        form.data.student_nims = selectedStudents;

        if (editingJadwal) {
            form.put(route('admin.jadwal.update', { id: editingJadwal.id }), {
                onSuccess: () => setJadwalModalOpen(false),
            });
        } else {
            form.post(route('admin.jadwal.store'), {
                onSuccess: () => setJadwalModalOpen(false),
            });
        }
    };

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('admin.jadwal.import'), {
            onSuccess: () => setImportModalOpen(false),
        });
    };

    const deleteJadwal = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal ujian ini?')) {
            form.delete(route('admin.jadwal.delete', { id: id }));
        }
    };

    // Filter Students inside Modal
    const filteredStudents = mahasiswas.filter(m => {
        const matchesSearch = (m.nama || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
            (m.nim || '').includes(studentSearch);
        const matchesClass = selectedClassFilter === 'Semua' || m.kelas === selectedClassFilter;
        return matchesSearch && matchesClass;
    });

    // Extract unique classes dynamically for the class dropdown
    const uniqueClasses = Array.from(new Set(mahasiswas.map(m => m.kelas).filter(Boolean))).sort();

    // Filters for schedules
    const filteredSchedules = schedules.filter(s => {
        const matchesSearch = s.mata_kuliah.nama_mk.toLowerCase().includes(search.toLowerCase()) || 
            s.dosen.nama.toLowerCase().includes(search.toLowerCase()) ||
            s.ruang.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'Semua' || s.jenis_ujian === filterType;
        const matchesStatus = filterStatus === 'Semua' || s.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const selectedCourse = courses.find(c => c.kode_mk === form.data.kode_mk);
    const isTheoryOnly = selectedCourse ? (selectedCourse.teori && !selectedCourse.praktek) : false;

    const dosenOptions = dosens.map(d => {
        const ampuMK = Array.isArray(d.ampu_mata_kuliah) ? d.ampu_mata_kuliah : [];
        const ampuKelas = Array.isArray(d.ampu_kelas) ? d.ampu_kelas : [];
        
        const isAmpuCourse = ampuMK.includes(form.data.kode_mk);
        const isAmpuClass = ampuKelas.map(k => k.trim().toUpperCase()).includes((form.data.kelas || '').trim().toUpperCase());
        
        const isRestricted = isTheoryOnly && isAmpuCourse && isAmpuClass;
        
        return {
            value: d.nip,
            label: isRestricted ? `${d.nama} (Dosen Pengampu Teori)` : d.nama,
            disabled: isRestricted
        };
    });

    // Stats
    const totalCount = schedules.length;
    const scheduledCount = schedules.filter(s => s.status === 'terjadwal').length;
    const activeCount = schedules.filter(s => s.status === 'berlangsung').length;
    const completedCount = schedules.filter(s => s.status === 'selesai').length;
    const cancelledCount = schedules.filter(s => s.status === 'dibatalkan').length;

    return (
        <AuthenticatedLayout subtitle="Kelola Agenda & Jadwal Ujian">
            <Head title="Manajemen Jadwal Ujian - SIBAU" />

            {/* Quick Indicators */}
            <div className="sibau-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {/* Total Agenda */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Total Agenda</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val" style={{ fontSize: '11pt' }}>{totalCount} JADWAL</div>
                            <div className="sibau-stat-sub" style={{ fontSize: '7.5pt' }}>Total agenda ujian</div>
                        </div>
                    </div>
                </div>

                {/* Terjadwal */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Terjadwal</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val" style={{ fontSize: '11pt' }}>{scheduledCount} UJIAN</div>
                            <div className="sibau-stat-sub" style={{ fontSize: '7.5pt' }}>Belum terlaksana</div>
                        </div>
                    </div>
                </div>

                {/* Berlangsung */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Berlangsung</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val" style={{ fontSize: '11pt' }}>{activeCount} UJIAN</div>
                            <div className="sibau-stat-sub" style={{ fontSize: '7.5pt' }}>Sedang berjalan</div>
                        </div>
                    </div>
                </div>

                {/* Selesai */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Selesai</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val" style={{ fontSize: '11pt' }}>{completedCount} UJIAN</div>
                            <div className="sibau-stat-sub" style={{ fontSize: '7.5pt' }}>Telah dilaksanakan</div>
                        </div>
                    </div>
                </div>

                {/* Dibatalkan */}
                <div className="sibau-card sibau-stat-card">
                    <div className="sibau-stat-card-header">Dibatalkan</div>
                    <div className="sibau-stat-card-body">
                        <div className="sibau-stat-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="sibau-stat-details">
                            <div className="sibau-stat-val" style={{ fontSize: '11pt' }}>{cancelledCount} UJIAN</div>
                            <div className="sibau-stat-sub" style={{ fontSize: '7.5pt' }}>Batal terlaksana</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                        <input 
                            type="text" 
                            className="sibau-input" 
                            placeholder="Cari mata kuliah, dosen, ruang..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ maxWidth: '300px' }}
                        />
                        <SearchableSelect 
                            options={[
                                { value: 'Semua', label: 'Semua Jenis' },
                                { value: 'UTS', label: 'UTS Only' },
                                { value: 'UAS', label: 'UAS Only' }
                            ]}
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ width: '150px' }}
                        />
                        <SearchableSelect 
                            options={[
                                { value: 'Semua', label: 'Semua Status' },
                                { value: 'terjadwal', label: 'Terjadwal' },
                                { value: 'berlangsung', label: 'Berlangsung' },
                                { value: 'selesai', label: 'Selesai' },
                                { value: 'dibatalkan', label: 'Dibatalkan' }
                            ]}
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ width: '150px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setImportModalOpen(true)} className="sibau-btn sibau-btn-secondary">📁 Import Excel</button>
                        <button onClick={openAdd} className="sibau-btn sibau-btn-primary">+ Tambah Jadwal</button>
                    </div>
                </div>
            </div>

            {/* Schedules Table */}
            <div className="sibau-card">
                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th>Mata Kuliah</th>
                                <th>Dosen Penguji / Pengawas</th>
                                <th>Waktu</th>
                                <th>Ruang / Kls</th>
                                <th>Jenis</th>
                                <th className="text-center">Peserta</th>
                                <th>Status</th>
                                <th style={{ width: '80px' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{s.mata_kuliah.nama_mk}</div>
                                        <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.kode_mk}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{s.dosen.nama}</div>
                                        <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>NIP: {s.nip_dosen}</div>
                                    </td>
                                    <td>
                                        <div>{s.tanggal}</div>
                                        <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.jam_mulai.substring(0, 5)} - {s.jam_selesai.substring(0, 5)}</div>
                                    </td>
                                    <td>
                                        <div>{s.ruang}</div>
                                        <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Kelas {s.kelas}</div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`sibau-badge ${s.jenis_ujian === 'UTS' ? 'badge-info' : 'badge-success'}`}>
                                            {s.jenis_ujian}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <strong>{s.peserta_ujians.length}</strong> orang
                                    </td>
                                    <td>
                                        <span className={`sibau-badge ${
                                            s.status === 'terjadwal' ? 'badge-info' : 
                                            s.status === 'berlangsung' ? 'badge-warning' : 
                                            s.status === 'selesai' ? 'badge-success' : 'badge-danger'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => openEdit(s)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '6px 8px' }}>✏️</button>
                                            <button onClick={() => deleteJadwal(s.id)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '6px 8px' }}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSchedules.length === 0 && (
                                <tr>
                                    <td colspan="8" className="text-center" style={{ color: 'var(--text-muted)' }}>Jadwal ujian tidak ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah/Edit Jadwal */}
            {jadwalModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal" style={{ maxWidth: '1050px', width: '95%' }}>
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">{editingJadwal ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian Baru'}</h3>
                            <button onClick={() => setJadwalModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitJadwal}>
                            <div className="sibau-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                
                                {/* Left Side: Details Form */}
                                <div>
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Mata Kuliah</label>
                                        <SearchableSelect 
                                            options={courses.map(c => ({ value: c.kode_mk, label: `${c.nama_mk} (${c.kode_mk})` }))}
                                            value={form.data.kode_mk} 
                                            onChange={e => {
                                                form.setData(data => ({
                                                    ...data,
                                                    kode_mk: e.target.value,
                                                    kelas: ''
                                                }));
                                            }}
                                        />
                                    </div>
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Dosen Penguji / Pengawas</label>
                                        <SearchableSelect 
                                            options={dosenOptions}
                                            value={form.data.nip_dosen} 
                                            onChange={e => form.setData('nip_dosen', e.target.value)}
                                        />
                                        {form.errors.nip_dosen && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.nip_dosen}</div>}
                                    </div>
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1.2 }}>
                                            <label className="sibau-label">Tanggal</label>
                                            <input 
                                                type="date" 
                                                className="sibau-input" 
                                                value={form.data.tanggal} 
                                                onChange={e => form.setData('tanggal', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <label className="sibau-label">Jenis</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: 'UTS', label: 'UTS' },
                                                    { value: 'UAS', label: 'UAS' }
                                                ]}
                                                value={form.data.jenis_ujian} 
                                                onChange={e => form.setData('jenis_ujian', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">Jam Mulai</label>
                                            <input 
                                                type="time" 
                                                className="sibau-input" 
                                                value={form.data.jam_mulai} 
                                                onChange={e => form.setData('jam_mulai', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">Jam Selesai</label>
                                            <input 
                                                type="time" 
                                                className="sibau-input" 
                                                value={form.data.jam_selesai} 
                                                onChange={e => form.setData('jam_selesai', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1.2 }}>
                                            <label className="sibau-label">Ruang Ujian</label>
                                            <input 
                                                type="text" 
                                                className="sibau-input" 
                                                value={form.data.ruang} 
                                                onChange={e => form.setData('ruang', e.target.value)} 
                                                placeholder="e.g. 1A-302"
                                                required 
                                            />
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <label className="sibau-label">Kelas</label>
                                            <SearchableSelect 
                                                options={
                                                    (() => {
                                                        const course = courses.find(c => c.kode_mk === form.data.kode_mk);
                                                        if (!course) return [];
                                                        const p = prodis.find(item => item.kode_prodi === course.kode_prodi);
                                                        const kls = p?.daftar_kelas || [];
                                                        return kls.map(k => ({ value: k, label: `Kelas ${k}` }));
                                                    })()
                                                }
                                                value={form.data.kelas} 
                                                onChange={e => form.setData('kelas', e.target.value)}
                                                placeholder="Pilih..."
                                            />
                                        </div>
                                    </div>
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">Sem. Aktif</label>
                                            <input type="text" className="sibau-input" value={form.data.semester_aktif} onChange={e => form.setData('semester_aktif', e.target.value)} required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">T.A.</label>
                                            <input type="text" className="sibau-input" value={form.data.tahun_akademik} onChange={e => form.setData('tahun_akademik', e.target.value)} required />
                                        </div>
                                    </div>
                                    {editingJadwal && (
                                        <div className="sibau-form-group">
                                            <label className="sibau-label">Status Pelaksanaan</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: 'terjadwal', label: 'Terjadwal' },
                                                    { value: 'berlangsung', label: 'Berlangsung' },
                                                    { value: 'selesai', label: 'Selesai' },
                                                    { value: 'dibatalkan', label: 'Dibatalkan' }
                                                ]}
                                                value={form.data.status} 
                                                onChange={e => form.setData('status', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Student Checkbox List */}
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', flex: 1.3 }}>
                                    <label className="sibau-label">Peserta Ujian (Mahasiswa)</label>
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                        <input 
                                            type="text" 
                                            className="sibau-input" 
                                            placeholder="Cari mahasiswa..." 
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <SearchableSelect 
                                            options={[
                                                { value: 'Semua', label: 'Semua Kelas' },
                                                ...uniqueClasses.map(c => ({ value: c, label: `Kelas ${c}` }))
                                            ]}
                                            value={selectedClassFilter} 
                                            onChange={e => setSelectedClassFilter(e.target.value)}
                                            style={{ width: '150px' }}
                                        />
                                    </div>

                                    {/* Quick Selection Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <button type="button" onClick={selectAllStudents} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ flex: 1 }}>Pilih Semua yang Tampil</button>
                                        <button type="button" onClick={deselectAllStudents} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ flex: 1 }}>Hapus Semua yang Tampil</button>
                                    </div>

                                    <div style={{ flex: 1, minHeight: '350px', maxHeight: '450px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                                        {filteredStudents.map((m) => (
                                            <label key={m.nim} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedStudents.includes(m.nim)} 
                                                    onChange={() => handleStudentCheckbox(m.nim)} 
                                                />
                                                <span style={{ fontSize: '9.5pt', color: 'var(--text-main)' }}>
                                                    <strong>{m.nim}</strong> - {m.nama} <span style={{ color: 'var(--text-muted)', fontSize: '8pt' }}>({m.kode_prodi} - Kls {m.kelas || '-'})</span>
                                                </span>
                                            </label>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <div style={{ padding: '20px', color: '#94a3b8', fontSize: '9.5pt', textAlign: 'center' }}>
                                                Tidak ada mahasiswa cocok.
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '10px', fontSize: '9.5pt', color: 'var(--text-muted)' }}>
                                        Terpilih: <strong style={{ color: 'var(--color-primary)', fontSize: '11pt' }}>{selectedStudents.length}</strong> mahasiswa.
                                    </div>
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setJadwalModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={form.processing} className="sibau-btn sibau-btn-primary">
                                    {editingJadwal ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Excel */}
            {importModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Import Jadwal Ujian dari Excel</h3>
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
                                    <div style={{ marginTop: '8px' }}>
                                        <a href={route('admin.templates.download', { type: 'jadwal' })} style={{ fontSize: '9pt', color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '600' }}>
                                            📥 Unduh Template Excel Jadwal
                                        </a>
                                    </div>
                                </div>
                                <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="sibau-label">Jenis Ujian</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: 'UTS', label: 'UTS' },
                                                { value: 'UAS', label: 'UAS' }
                                            ]}
                                            value={importForm.data.jenis_ujian} 
                                            onChange={e => importForm.setData('jenis_ujian', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="sibau-label">Semester Aktif</label>
                                        <input type="text" className="sibau-input" value={importForm.data.semester_aktif} onChange={e => importForm.setData('semester_aktif', e.target.value)} required />
                                    </div>
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Tahun Akademik</label>
                                    <input type="text" className="sibau-input" value={importForm.data.tahun_akademik} onChange={e => importForm.setData('tahun_akademik', e.target.value)} required />
                                </div>
                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    💡 <strong>Info Format Kolom Excel:</strong><br />
                                    Format baris ke-6 tabel Excel harus berurutan:<br />
                                    <strong>(Hari/Tanggal, Jam, Ruang 1, Ruang 2, Mata Kuliah, SKS, Kls, Jml Mhs, Dosen)</strong>
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
