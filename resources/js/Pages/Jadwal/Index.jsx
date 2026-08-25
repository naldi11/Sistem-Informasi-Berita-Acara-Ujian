import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

const TAHAP_SLOTS = [
    { value: '1', label: 'Tahap 1 (08:30 - 10:00)', start: '08:30', end: '10:00' },
    { value: '2', label: 'Tahap 2 (10:30 - 12:00)', start: '10:30', end: '12:00' },
    { value: '3', label: 'Tahap 3 (13:00 - 15:00)', start: '13:00', end: '15:00' },
    { value: '4', label: 'Tahap 4 (15:30 - 17:30)', start: '15:30', end: '17:30' },
    { value: '5', label: 'Tahap 5 (18:00 - 19:30)', start: '18:00', end: '19:30' },
    { value: '6', label: 'Tahap 6 (19:30 - 21:00)', start: '19:30', end: '21:00' },
];

const getEndTimeForStart = (startVal) => {
    if (!startVal) return '';
    const formattedStart = startVal.substring(0, 5);
    const matchedSlot = TAHAP_SLOTS.find(slot => slot.start === formattedStart);
    if (matchedSlot) {
        return matchedSlot.end;
    }
    const parts = formattedStart.split(':');
    if (parts.length < 2) return '';
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const newHours = (hours + 2) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getSesiForStart = (startVal) => {
    if (!startVal) return '';
    const formattedStart = startVal.substring(0, 5);
    const matchedSlot = TAHAP_SLOTS.find(slot => slot.start === formattedStart);
    return matchedSlot ? matchedSlot.value : '';
};

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
        sesi: '1',
        jam_mulai: '08:30',
        jam_selesai: '10:00',
        ruang: '',
        kelas: 'A',
        jenis_ujian: 'UTS',
        semester_aktif: 'Ganjil',
        tahun_akademik: '2025/2026',
        status: 'terjadwal',
        student_nims: [],
    });

    const isSemesterGanjil = /ganjil/i.test(form.data.semester_aktif || '');
    const availableCourses = courses.filter(c => {
        const sem = parseInt(c.semester, 10);
        return isSemesterGanjil ? (sem % 2 !== 0) : (sem % 2 === 0);
    });

    // Form for Excel Import
    const importForm = useForm({
        excel_file: null,
        jenis_ujian: 'UTS',
        semester_aktif: 'Ganjil 2025/2026',
        tahun_akademik: '2025/2026',
    });    const openAdd = () => {
        setEditingJadwal(null);
        setSelectedStudents([]);
        form.reset();
        
        const defaultSemAktif = 'Ganjil';
        const defaultIsGanjil = /ganjil/i.test(defaultSemAktif);
        const filteredDefaultMks = courses.filter(c => defaultIsGanjil ? (parseInt(c.semester, 10) % 2 !== 0) : (parseInt(c.semester, 10) % 2 === 0));
        const defaultMk = filteredDefaultMks[0]?.kode_mk || courses[0]?.kode_mk || '';
        const defaultDosen = dosens[0]?.nip || '';

        form.setData({
            kode_mk: defaultMk,
            nip_dosen: defaultDosen,
            tanggal: '',
            sesi: '1',
            jam_mulai: '08:30',
            jam_selesai: '10:00',
            ruang: '',
            kelas: 'A',
            jenis_ujian: 'UTS',
            semester_aktif: defaultSemAktif,
            tahun_akademik: '2025/2026',
            status: 'terjadwal',
            student_nims: [],
        });
        setSelectedClassFilter('A');
        form.clearErrors();
        setJadwalModalOpen(true);
    };
    const openEdit = (sched) => {
        setEditingJadwal(sched);
        const studentNims = sched.peserta_ujians.map(p => p.nim);
        setSelectedStudents(studentNims);
        // Auto-set class filter so students of that class are shown immediately
        setSelectedClassFilter(sched.kelas || 'Semua');
        
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
            semester_aktif: sched.semester_aktif && /genap/i.test(sched.semester_aktif) ? 'Genap' : 'Ganjil',
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

    const handleValidate = (id, status) => {
        if (confirm(`Apakah Anda yakin ingin memvalidasi berita acara ini menjadi: ${status.toUpperCase()}?`)) {
            router.post(route('admin.berita-acara.validate', { id: id }), {
                status_validasi: status
            });
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

    const dosenOptions = dosens.map(d => {
        return {
            value: d.nip,
            label: d.nama,
            disabled: false
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
            <Head title="Manajemen Jadwal Ujian - BERITA UJIAN" />

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
                            placeholder="Cari mata kuliah, pengawas, ruang..." 
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
                        <button onClick={() => setImportModalOpen(true)} className="sibau-btn sibau-btn-secondary">📥 Import Jadwal</button>
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
                                <th>Hari, Tanggal</th>
                                <th>Jam</th>
                                <th>Ruangan</th>
                                <th>Mata Kuliah</th>
                                <th>Dosen Pengampu</th>
                                <th>Pengawas</th>
                                <th>T.A / Angkatan</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th className="text-center">Peserta</th>
                                <th style={{ width: '180px' }}>Aksi</th>
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
                                            {s.token && (
                                                <div style={{ fontSize: '8.5pt', color: '#10b981', fontWeight: 'bold', marginTop: '2px' }}>
                                                    🔑 {s.token}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.nama_mk}</div>
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '8.5pt', color: 'var(--text-muted)' }}>{s.kode_mk}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.mata_kuliah.dosen_pengampu ? s.mata_kuliah.dosen_pengampu.nama : <span style={{ color: 'var(--text-muted)' }}>-</span>}</div>
                                            {s.mata_kuliah.dosen_pengampu && (
                                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>NIP: {s.mata_kuliah.nip_dosen}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.dosen.nama}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>NIDN: {s.nip_dosen}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{s.tahun_akademik}</div>
                                            <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Sem: {s.semester_aktif}</div>
                                        </td>
                                        <td className="text-center">
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
                                             <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                 {s.status === 'berlangsung' && s.berita_acara?.status_validasi === 'menunggu_validasi' && (
                                                     <>
                                                         <button 
                                                             onClick={() => handleValidate(s.berita_acara.id, 'tervalidasi')} 
                                                             className="sibau-btn sibau-btn-approve sibau-btn-sm" 
                                                             style={{ padding: '6px 10px', fontSize: '8.5pt', whiteSpace: 'nowrap' }}
                                                         >
                                                             Setujui
                                                         </button>
                                                         <button 
                                                             onClick={() => handleValidate(s.berita_acara.id, 'draft')} 
                                                             className="sibau-btn sibau-btn-reject sibau-btn-sm" 
                                                             style={{ padding: '6px 10px', fontSize: '8.5pt', whiteSpace: 'nowrap' }}
                                                         >
                                                             Tolak
                                                         </button>
                                                     </>
                                                 )}
                                                 <button onClick={() => openEdit(s)} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ padding: '6px 8px' }}>✏️</button>
                                                 <button onClick={() => deleteJadwal(s.id)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '6px 8px' }}>🗑️</button>
                                             </div>
                                        </td>
                                    </tr>
                                );
                            })}
                             {filteredSchedules.length === 0 && (
                                 <tr>
                                     <td colSpan="11" className="text-center" style={{ color: 'var(--text-muted)' }}>Jadwal ujian tidak ditemukan.</td>
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
                                    {/* 1. Semester Aktif & Tahun Akademik (Pertama di-pick) */}
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1.2 }}>
                                            <label className="sibau-label">Semester Aktif</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: 'Ganjil', label: 'Ganjil' },
                                                    { value: 'Genap', label: 'Genap' },
                                                ]}
                                                value={form.data.semester_aktif} 
                                                onChange={e => {
                                                    const newSem = e.target.value;
                                                    const isGanjil = /ganjil/i.test(newSem);
                                                    const filteredMks = courses.filter(c => isGanjil ? (parseInt(c.semester, 10) % 2 !== 0) : (parseInt(c.semester, 10) % 2 === 0));
                                                    form.setData(data => ({
                                                        ...data,
                                                        semester_aktif: newSem,
                                                        kode_mk: filteredMks.some(c => c.kode_mk === data.kode_mk) ? data.kode_mk : (filteredMks[0]?.kode_mk || '')
                                                    }));
                                                }}
                                            />
                                            {form.errors.semester_aktif && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.semester_aktif}</div>}
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <label className="sibau-label">T.A.</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: '2024/2025', label: '2024/2025' },
                                                    { value: '2025/2026', label: '2025/2026' },
                                                    { value: '2026/2027', label: '2026/2027' },
                                                    { value: '2027/2028', label: '2027/2028' },
                                                ]}
                                                value={form.data.tahun_akademik} 
                                                onChange={e => form.setData('tahun_akademik', e.target.value)} 
                                            />
                                            {form.errors.tahun_akademik && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.tahun_akademik}</div>}
                                        </div>
                                    </div>

                                    {/* 2. Mata Kuliah (Disesuaikan dengan Semester Aktif: Ganjil/Genap) */}
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">
                                            Mata Kuliah ({isSemesterGanjil ? 'Hanya Sem. Ganjil: 1, 3, 5, 7' : 'Hanya Sem. Genap: 2, 4, 6, 8'})
                                        </label>
                                        <SearchableSelect 
                                            options={availableCourses.map(c => ({ value: c.kode_mk, label: c.semester != null ? `${c.nama_mk} (${c.kode_mk}) - Sem. ${c.semester}` : `${c.nama_mk} (${c.kode_mk})` }))}
                                            value={form.data.kode_mk} 
                                            onChange={e => form.setData('kode_mk', e.target.value)}
                                        />
                                        {form.errors.kode_mk && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.kode_mk}</div>}
                                    </div>

                                    {/* 3. Pengawas */}
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Pengawas</label>
                                        <SearchableSelect 
                                            options={dosenOptions}
                                            value={form.data.nip_dosen} 
                                            onChange={e => form.setData('nip_dosen', e.target.value)}
                                        />
                                        {form.errors.nip_dosen && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.nip_dosen}</div>}
                                    </div>

                                    {/* 4. Tanggal & Jenis Ujian */}
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1.5 }}>
                                            <label className="sibau-label">Tanggal</label>
                                            <input 
                                                type="date" 
                                                className="sibau-input" 
                                                value={form.data.tanggal} 
                                                onChange={e => form.setData('tanggal', e.target.value)} 
                                                required 
                                            />
                                            {form.errors.tanggal && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.tanggal}</div>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">Jenis</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: 'UTS', label: 'UTS' },
                                                    { value: 'UAS', label: 'UAS' }
                                                ]}
                                                value={form.data.jenis_ujian} 
                                                onChange={e => form.setData('jenis_ujian', e.target.value)}
                                            />
                                            {form.errors.jenis_ujian && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.jenis_ujian}</div>}
                                        </div>
                                    </div>

                                    {/* 5. Tahap Ujian (Sesi) */}
                                    <div className="sibau-form-group">
                                        <label className="sibau-label">Pilih Tahap Ujian (Sesi)</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: '', label: '-- Pilih Tahap (Opsional) --' },
                                                ...TAHAP_SLOTS.map(t => ({ value: t.value, label: t.label }))
                                            ]}
                                            value={form.data.sesi || getSesiForStart(form.data.jam_mulai)} 
                                            onChange={e => {
                                                const selectedValue = e.target.value;
                                                const slot = TAHAP_SLOTS.find(s => s.value === selectedValue);
                                                if (slot) {
                                                    form.setData(data => ({
                                                        ...data,
                                                        sesi: slot.value,
                                                        jam_mulai: slot.start,
                                                        jam_selesai: slot.end,
                                                    }));
                                                } else {
                                                    form.setData('sesi', selectedValue);
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* 6. Jam Mulai & Jam Selesai */}
                                    <div className="sibau-form-group" style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label">Jam Mulai</label>
                                            <input 
                                                type="time" 
                                                className="sibau-input" 
                                                value={form.data.jam_mulai} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const autoEnd = getEndTimeForStart(val);
                                                    const autoSesi = getSesiForStart(val);
                                                    form.setData(data => ({
                                                        ...data,
                                                        jam_mulai: val,
                                                        jam_selesai: autoEnd || data.jam_selesai,
                                                        sesi: autoSesi || data.sesi
                                                    }));
                                                }}
                                                required 
                                            />
                                            {form.errors.jam_mulai && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.jam_mulai}</div>}
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
                                            {form.errors.jam_selesai && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.jam_selesai}</div>}
                                        </div>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '8.5pt', marginTop: '-8px', marginBottom: '16px' }}>
                                        * Sesuai Tahap: 1 (08:30-10:00), 2 (10:30-12:00), 3 (13:00-15:00), 4 (15:30-17:30), 5 (18:00-19:30), 6 (19:30-21:00).
                                    </div>

                                    {/* 7. Ruang Ujian & Kelas */}
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
                                            {form.errors.ruang && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.ruang}</div>}
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <label className="sibau-label">Kelas</label>
                                            <SearchableSelect 
                                                options={[
                                                    { value: '', label: 'Pilih Kelas...' },
                                                    ...uniqueClasses.map(k => ({ value: k, label: `Kelas ${k}` }))
                                                ]}
                                                value={form.data.kelas} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    form.setData('kelas', val);
                                                    setSelectedClassFilter(val || 'Semua');
                                                }}
                                                placeholder="Pilih..."
                                            />
                                            {form.errors.kelas && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.kelas}</div>}
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
                                            {form.errors.status && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{form.errors.status}</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Student Checkbox List */}
                                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', flex: 1.3 }}>
                                    <label className="sibau-label">Peserta Ujian (Mahasiswa)</label>
                                    {form.errors.student_nims && <div style={{ color: 'red', fontSize: '9pt', marginBottom: '8px' }}>{form.errors.student_nims}</div>}
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                        <input 
                                            type="text" 
                                            className="sibau-input" 
                                            placeholder="Cari mahasiswa..." 
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            style={{ width: '100%' }}
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
                    <div className="sibau-modal" style={{ maxWidth: '600px', width: '90%' }}>
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
                                        accept=".xlsx, .xls"
                                        required 
                                    />
                                    {importForm.errors.excel_file && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{importForm.errors.excel_file}</div>}
                                </div>
                                <div style={{ fontSize: '8.5pt', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    💡 <strong>Info Format Kolom Excel:</strong><br />
                                    Data harus berada pada Sheet pertama dengan format kolom:<br />
                                    <strong>A: [Kosong], B: Hari/Tanggal, C: Jam, D: Ruang 1, E: Ruang 2, F: Mata Kuliah, G: SKS, H: Kls, I: Jml Mhs, J: Dosen</strong><br />
                                    <div className="mt-2 mb-2">
                                        <a href={route('admin.templates.download', 'jadwal')} className="text-indigo-600 hover:text-indigo-900 underline text-sm">
                                            📥 Unduh Template Excel
                                        </a>
                                    </div>
                                    <span style={{ fontSize: '8pt', color: '#64748b' }}>* Impor otomatis memvalidasi bentrok ruangan, bentrok dosen pengawas, dan bentrok mahasiswa secara penuh. Jika ada satu saja baris data yang bentrok atau tidak valid (mata kuliah/dosen tidak terdaftar), seluruh transaksi impor akan dibatalkan (rollback).</span>
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
