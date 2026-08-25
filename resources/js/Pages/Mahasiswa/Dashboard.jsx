import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard({ mahasiswa, schedules }) {
    const { flash } = usePage().props;

    const handleLogout = (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar dari portal?')) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('mahasiswa.logout');
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (token) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = '_token';
                csrfInput.value = token;
                form.appendChild(csrfInput);
            }
            document.body.appendChild(form);
            form.submit();
        }
    };

    // Calculate quick stats
    const totalExams = schedules.length;
    const attendedCount = schedules.filter(s => s.kehadiran === 'hadir').length;
    const pendingCount = schedules.filter(s => s.kehadiran === 'belum_ditentukan').length;

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'M';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    // Categorize and sort schedules
    const now = new Date();
    const ongoingExams = [];
    const upcomingExams = [];
    const completedExams = [];

    schedules.forEach(exam => {
        const examStart = new Date(`${exam.tanggal}T${exam.jam_mulai}`);
        
        // Attendance check
        const isAttended = exam.kehadiran === 'hadir';
        
        if (isAttended) {
            completedExams.push(exam);
        } else if (exam.is_active) {
            ongoingExams.push(exam);
        } else if (now < examStart) {
            upcomingExams.push(exam);
        } else {
            // Exam date/time has passed but attendance was not recorded
            completedExams.push(exam);
        }
    });

    const parseDateTime = (dateStr, timeStr) => {
        return new Date(`${dateStr}T${timeStr}`);
    };

    // Sort ongoing: start time ascending (first to start first)
    ongoingExams.sort((a, b) => parseDateTime(a.tanggal, a.jam_mulai) - parseDateTime(b.tanggal, b.jam_mulai));

    // Sort upcoming: start time ascending (nearest first)
    upcomingExams.sort((a, b) => parseDateTime(a.tanggal, a.jam_mulai) - parseDateTime(b.tanggal, b.jam_mulai));

    // Sort completed: start time descending (most recent first)
    completedExams.sort((a, b) => parseDateTime(b.tanggal, b.jam_mulai) - parseDateTime(a.tanggal, a.jam_mulai));

    const renderExamCard = (exam, statusType) => {
        const isAttended = exam.kehadiran === 'hadir';
        const isPending = exam.kehadiran === 'belum_ditentukan';
        const isActive = statusType === 'ongoing';
        const isCompleted = statusType === 'completed';

        return (
            <div 
                key={exam.id} 
                className={`glass-card ${isActive ? 'active-card' : ''}`}
                style={{
                    borderRadius: '20px',
                    padding: '24px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isCompleted ? 0.75 : 1
                }}
            >
                {/* Colored Left Bar Border for Status */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    background: isActive 
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                        : isAttended 
                            ? 'rgba(16, 185, 129, 0.4)' 
                            : isCompleted 
                                ? '#ef4444' // red left bar for missed exams
                                : 'rgba(255, 255, 255, 0.05)'
                }}></div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* UTS/UAS Type Badge */}
                    <div style={{
                        width: '54px',
                        height: '54px',
                        background: exam.jenis_ujian === 'UTS' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        border: exam.jenis_ujian === 'UTS' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11.5pt',
                        fontWeight: '800',
                        color: exam.jenis_ujian === 'UTS' ? '#3b82f6' : '#10b981',
                        boxShadow: exam.jenis_ujian === 'UTS' ? '0 4px 15px rgba(59, 130, 246, 0.05)' : '0 4px 15px rgba(16, 185, 129, 0.05)'
                    }}>
                        {exam.jenis_ujian}
                    </div>

                    {/* Course Details Block */}
                    <div>
                        <h4 style={{ fontSize: '13pt', fontWeight: '700', margin: '0 0 8px 0', color: '#ffffff', letterSpacing: '-0.3px' }}>
                            {exam.mata_kuliah.nama_mk}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '14px', color: '#94a3b8', fontSize: '9.5pt', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#64748b' }}>Kode:</span> <strong style={{ color: '#e2e8f0' }}>{exam.kode_mk}</strong>
                                </span>
                                <span style={{ color: '#334155' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#64748b' }}>Pengawas:</span> <strong style={{ color: '#e2e8f0' }}>{exam.dosen.nama}</strong>
                                </span>
                                {exam.sesi && (
                                    <>
                                        <span style={{ color: '#334155' }}>•</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: '#64748b' }}>Sesi:</span> <strong style={{ color: '#e2e8f0' }}>{exam.sesi}</strong>
                                        </span>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '14px', color: '#94a3b8', fontSize: '9.5pt', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#64748b' }}>Tanggal:</span> <strong style={{ color: '#cbd5e1' }}>{exam.tanggal}</strong>
                                </span>
                                <span style={{ color: '#334155' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#64748b' }}>Waktu:</span> <strong style={{ color: '#cbd5e1' }}>{exam.jam_mulai.substring(0, 5)} - {exam.jam_selesai.substring(0, 5)} WIB</strong>
                                </span>
                                <span style={{ color: '#334155' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#64748b' }}>Ruang:</span> <span style={{ color: '#38bdf8', fontWeight: '700', background: 'rgba(56, 189, 248, 0.06)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.12)' }}>{exam.ruang}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status & Actions Block */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '8pt', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Kehadiran</span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: isAttended 
                                ? 'rgba(16, 185, 129, 0.08)' 
                                : isActive 
                                    ? 'rgba(16, 185, 129, 0.05)'
                                    : !isPending 
                                        ? 'rgba(239, 68, 68, 0.08)' // red background for absent/missed
                                        : 'rgba(255, 255, 255, 0.02)',
                            border: isAttended 
                                ? '1px solid rgba(16, 185, 129, 0.2)' 
                                : isActive
                                    ? '1px solid rgba(16, 185, 129, 0.15)'
                                    : !isPending
                                        ? '1px solid rgba(239, 68, 68, 0.2)'
                                        : '1px solid rgba(255, 255, 255, 0.05)',
                            color: isAttended ? '#10b981' : isActive ? '#34d399' : !isPending ? '#ef4444' : '#64748b',
                            fontSize: '8.5pt',
                            fontWeight: '700'
                        }}>
                            {isActive && <span className="pulse-dot"></span>}
                            {isAttended ? 'Hadir (Sukses)' : isActive ? 'Sedang Berlangsung' : !isPending ? 'Tidak Hadir' : 'Belum Absen'}
                        </span>
                    </div>

                    {isActive ? (
                        <Link
                            href={route('mahasiswa.absen.form', { jadwal_id: exam.id })}
                            className="btn-primary-gradient"
                            style={{
                                padding: '11px 22px',
                                color: '#ffffff',
                                borderRadius: '12px',
                                fontSize: '9.5pt',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>✍️ Mulai Absensi</span>
                        </Link>
                    ) : (
                        isPending && (
                            <button 
                                disabled 
                                style={{
                                    padding: '11px 22px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.04)',
                                    color: '#475569',
                                    borderRadius: '12px',
                                    fontSize: '9.5pt',
                                    fontWeight: '700',
                                    cursor: 'not-allowed'
                                }}
                            >
                                {isCompleted ? 'Selesai' : 'Belum Mulai'}
                            </button>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#090d16',
            color: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            paddingBottom: '60px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Head title="Dashboard Mahasiswa - BERITA UJIAN" />

            {/* Embedded styles for animations and class rules */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                
                body {
                    background-color: #090d16;
                }

                .bg-glow-1 {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%);
                    top: -150px;
                    left: -100px;
                    z-index: 0;
                    pointer-events: none;
                    filter: blur(40px);
                }

                .bg-glow-2 {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.07) 0%, rgba(99, 102, 241, 0) 70%);
                    bottom: -150px;
                    right: -100px;
                    z-index: 0;
                    pointer-events: none;
                    filter: blur(50px);
                }

                .glass-header {
                    background: rgba(9, 13, 22, 0.75) !important;
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
                }

                .glass-card {
                    background: rgba(17, 24, 39, 0.45);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.35);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .glass-card:hover {
                    transform: translateY(-3px);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 15px 35px 0 rgba(99, 102, 241, 0.1);
                }

                .active-card {
                    border-color: rgba(16, 185, 129, 0.25);
                    background: rgba(16, 185, 129, 0.02);
                }

                .active-card:hover {
                    border-color: rgba(16, 185, 129, 0.45);
                    box-shadow: 0 15px 35px 0 rgba(16, 185, 129, 0.15);
                }

                .pulse-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background-color: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    animation: pulse 1.6s infinite;
                }

                .logout-btn {
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    transition: all 0.2s ease;
                }

                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.18);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    transform: translateY(-1px);
                }

                .btn-primary-gradient {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                    transition: all 0.2s ease;
                }

                .btn-primary-gradient:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
                    filter: brightness(1.05);
                }

                @keyframes pulse {
                    0% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        transform: scale(1);
                        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
                    }
                    100% {
                        transform: scale(0.95);
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }
            `}} />

            {/* Glowing backgrounds */}
            <div className="bg-glow-1"></div>
            <div className="bg-glow-2"></div>

            {/* Premium Sticky Header */}
            <header className="glass-header" style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                padding: '16px 24px'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '38px',
                            height: '38px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            borderRadius: '10px',
                            fontSize: '15pt',
                            fontWeight: '800',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                        }}>S</div>
                        <div>
                            <span style={{ fontWeight: '800', fontSize: '15pt', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BERITA UJIAN</span>
                            <span style={{ fontSize: '8.5pt', color: '#10b981', marginLeft: '10px', fontWeight: '700', letterSpacing: '1px', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.05)' }}>PORTAL MAHASISWA</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout} 
                        className="logout-btn"
                        style={{
                            padding: '8px 18px',
                            borderRadius: '10px',
                            fontSize: '9.5pt',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>Keluar</span>
                        <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '35px auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                {/* Flash Messages */}
                {flash.success && (
                    <div style={{
                        padding: '16px 20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '14px',
                        color: '#34d399',
                        fontSize: '9.5pt',
                        fontWeight: '600',
                        marginBottom: '24px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '12pt' }}>✨</span>
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div style={{
                        padding: '16px 20px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '14px',
                        color: '#f87171',
                        fontSize: '9.5pt',
                        fontWeight: '600',
                        marginBottom: '24px',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '12pt' }}>⚠️</span>
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Hero Dashboard Section */}
                <div className="glass-card" style={{
                    borderRadius: '20px',
                    padding: '30px',
                    marginBottom: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '30px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Profile Avatar Initials with Glow */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18pt',
                            fontWeight: '800',
                            color: '#ffffff',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                            border: '2px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            {getInitials(mahasiswa.nama)}
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '9pt', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Mahasiswa Aktif</span>
                                <span style={{
                                    fontSize: '8pt',
                                    fontWeight: '700',
                                    color: '#10b981',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    {mahasiswa.status.toUpperCase()}
                                </span>
                            </div>
                            <h2 style={{ 
                                fontSize: '22pt', 
                                fontWeight: '800', 
                                margin: '6px 0 10px 0', 
                                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                {mahasiswa.nama}
                            </h2>
                            <div style={{ display: 'flex', gap: '14px', color: '#94a3b8', fontSize: '9.5pt', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span>NIM: <strong style={{ color: '#f8fafc' }}>{mahasiswa.nim}</strong></span>
                                <span style={{ color: '#475569' }}>|</span>
                                <span>Kelas: <strong style={{ color: '#f8fafc' }}>{mahasiswa.kelas || '-'}</strong></span>
                                <span style={{ color: '#475569' }}>|</span>
                                <span>Prodi: <strong style={{ color: '#f8fafc' }}>{mahasiswa.program_studi?.nama_prodi || mahasiswa.kode_prodi}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 100px)',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        padding: '12px 18px',
                        borderRadius: '16px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16pt', fontWeight: '800', color: '#38bdf8' }}>{totalExams}</div>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: '600', marginTop: '2px', textTransform: 'uppercase' }}>Total</div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <div style={{ fontSize: '16pt', fontWeight: '800', color: '#10b981' }}>{attendedCount}</div>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: '600', marginTop: '2px', textTransform: 'uppercase' }}>Hadir</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16pt', fontWeight: '800', color: '#f59e0b' }}>{pendingCount}</div>
                            <div style={{ fontSize: '8pt', color: '#64748b', fontWeight: '600', marginTop: '2px', textTransform: 'uppercase' }}>Belum</div>
                        </div>
                    </div>
                </div>

                {/* Panduan Singkat Ujian bagi Mahasiswa */}
                <div className="glass-card" style={{
                    borderRadius: '20px',
                    padding: '20px 24px',
                    marginBottom: '30px',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13pt' }}>💡</span>
                        <h4 style={{ margin: 0, fontSize: '10.5pt', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Panduan Absensi &amp; Pelaksanaan Ujian
                        </h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '9.5pt', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <li>Pastikan Anda hadir di ruang ujian tepat waktu sesuai jadwal sesi yang tertera.</li>
                        <li>Ketika ujian berstatus <strong style={{ color: '#10b981' }}>SEDAng BERLANGSUNG</strong>, tombol <strong style={{ color: '#10b981' }}>Absen Sekarang</strong> akan aktif.</li>
                        <li>Klik tombol tersebut, masukkan tanda tangan digital Anda pada kolom yang disediakan, lalu kirim.</li>
                        <li>Absensi Anda berhasil direkam jika status kehadiran berubah menjadi <strong style={{ color: '#10b981' }}>HADIR</strong> dengan tanda centang hijau.</li>
                    </ul>
                </div>

                {/* Exam Schedule Sections */}
                <div>
                    {totalExams === 0 ? (
                        <div className="glass-card" style={{
                            textAlign: 'center',
                            padding: '70px 30px',
                            borderRadius: '20px',
                            color: '#64748b',
                            border: '1px dashed rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{ fontSize: '38pt', marginBottom: '14px' }}>🏜️</div>
                            <h4 style={{ fontSize: '13pt', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>Tidak Ada Jadwal Terjadwal</h4>
                            <p style={{ fontSize: '9.5pt', margin: 0 }}>Jadwal pelaksanaan ujian Anda belum didaftarkan di sistem oleh Administrator.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
                            
                            {/* SECTION 1: SEDANG BERLANGSUNG */}
                            {ongoingExams.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '12.5pt', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#10b981' }}>
                                        <span className="pulse-dot" style={{ width: '10px', height: '10px' }}></span>
                                        <span>Ujian Sedang Berlangsung ({ongoingExams.length})</span>
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {ongoingExams.map(exam => renderExamCard(exam, 'ongoing'))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: BELUM MULAI */}
                            {upcomingExams.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '12.5pt', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#38bdf8' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', fontSize: '10.5pt' }}>⏳</span>
                                        <span>Ujian Akan Datang ({upcomingExams.length})</span>
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {upcomingExams.map(exam => renderExamCard(exam, 'upcoming'))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: SUDAH SELESAI */}
                            {completedExams.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '12.5pt', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#64748b' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'rgba(100, 116, 139, 0.1)', borderRadius: '6px', fontSize: '10.5pt' }}>✓</span>
                                        <span>Riwayat Ujian / Sudah Selesai ({completedExams.length})</span>
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {completedExams.map(exam => renderExamCard(exam, 'completed'))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
