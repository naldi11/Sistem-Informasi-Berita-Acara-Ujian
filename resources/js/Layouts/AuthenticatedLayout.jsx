import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ children, subtitle }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState('success');

    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sibau_sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sibau_sidebar_collapsed', String(next));
            return next;
        });
    };

    // Apply custom body background theme
    useEffect(() => {
        document.body.classList.add('sibau-theme');
        return () => {
            document.body.classList.remove('sibau-theme');
        };
    }, []);

    // Listen to Inertia flash messages
    useEffect(() => {
        if (flash?.success) {
            setAlertMessage(flash.success);
            setAlertType('success');
            const timer = setTimeout(() => setAlertMessage(null), 5000);
            return () => clearTimeout(timer);
        } else if (flash?.error) {
            setAlertMessage(flash.error);
            setAlertType('error');
            const timer = setTimeout(() => setAlertMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const isAdmin = user.role === 'admin';

    return (
        <div className="sibau-app-container">
            {/* Floating Toast Notification */}
            {alertMessage && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '80px',
                        right: '24px',
                        zIndex: 9999,
                        background: alertType === 'success' ? '#10b981' : '#ef4444',
                        color: '#ffffff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontWeight: '600',
                        fontSize: '9.5pt',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <span style={{ fontSize: '12pt' }}>{alertType === 'success' ? '✅' : '❌'}</span>
                    <span>{alertMessage}</span>
                    <button 
                        onClick={() => setAlertMessage(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '12pt',
                            fontWeight: 'bold',
                            padding: '0 0 0 8px',
                            marginLeft: 'auto',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Top Full-Width Header Bar */}
            <header className="sibau-header-bar">
                <div className="sibau-header-left">
                    <button 
                        onClick={toggleSidebar}
                        className="sibau-sidebar-toggle-btn hidden md:flex"
                        title={sidebarCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            marginRight: '8px',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="sibau-header-logo">
                        <div className="sibau-logo-badge" style={{ background: '#ffffff', color: '#000000', borderRadius: '4px', border: '1px solid #000000' }}>S</div>
                        <span className="sibau-logo-text">SIBAU</span>
                    </div>
                    <div className="sibau-header-divider"></div>
                    <div className="sibau-header-title" style={{ fontSize: '9.5pt', fontWeight: 'bold' }}>
                        FAKULTAS EKONOMI | UNIVERSITAS METHODIST INDONESIA
                    </div>
                </div>

                <div className="sibau-header-profile-section">
                    <span className="sibau-header-profile-name">
                        {user.role === 'admin' ? 'Admin' : 'Dosen'}: {user.name}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button" 
                        className="sibau-header-profile-logout"
                        style={{ color: '#ffffff', fontWeight: 'normal' }}
                    >
                        Log Out
                    </Link>
                </div>
            </header>

            <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
                {/* Sidebar Navigation */}
                <aside className={`sibau-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'block' : 'hidden md:flex'}`}>
                    <nav className="sibau-sidebar-nav">
                        {isAdmin ? (
                            <>
                                <Link 
                                    href={route('admin.dashboard')} 
                                    className={`sibau-sidebar-link ${route().current('admin.dashboard') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    <span className="sidebar-text">Dashboard</span>
                                </Link>
                                <Link 
                                    href={route('admin.jadwal')} 
                                    className={`sibau-sidebar-link ${route().current('admin.jadwal') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="sidebar-text">Data Ujian</span>
                                </Link>
                                <Link 
                                    href={route('admin.berita-acara')} 
                                    className={`sibau-sidebar-link ${route().current('admin.berita-acara') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="sidebar-text">Berita Acara (BAU)</span>
                                </Link>
                                <Link 
                                    href={route('admin.users')} 
                                    className={`sibau-sidebar-link ${route().current('admin.users') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <span className="sidebar-text">Dosen & Mahasiswa</span>
                                </Link>
                                <Link 
                                    href={route('admin.prodi')} 
                                    className={`sibau-sidebar-link ${route().current('admin.prodi') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    <span className="sidebar-text">Prodi</span>
                                </Link>
                                <Link 
                                    href={route('admin.matakuliah')} 
                                    className={`sibau-sidebar-link ${route().current('admin.matakuliah') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    <span className="sidebar-text">Mata Kuliah</span>
                                </Link>
                                <Link 
                                    href={route('admin.laporan')} 
                                    className={`sibau-sidebar-link ${route().current('admin.laporan') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                                    <span className="sidebar-text">Laporan</span>
                                </Link>
                                <Link 
                                    href={route('admin.pengaturan')} 
                                    className={`sibau-sidebar-link ${route().current('admin.pengaturan') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="sidebar-text">Pengaturan</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link 
                                    href={route('dosen.dashboard')} 
                                    className={`sibau-sidebar-link ${route().current('dosen.dashboard') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    <span className="sidebar-text">Dashboard Dosen</span>
                                </Link>
                                <Link 
                                    href={route('dosen.jadwal')} 
                                    className={`sibau-sidebar-link ${route().current('dosen.jadwal') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="sidebar-text">Jadwal Mengawas</span>
                                </Link>
                                <Link 
                                    href={route('dosen.berita-acara')} 
                                    className={`sibau-sidebar-link ${route().current('dosen.berita-acara') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="sidebar-text">BAU Dosen</span>
                                </Link>
                                <Link 
                                    href={route('dosen.laporan')} 
                                    className={`sibau-sidebar-link ${route().current('dosen.laporan') ? 'active' : ''}`}
                                >
                                    <svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                                    <span className="sidebar-text">Laporan Dosen</span>
                                </Link>
                            </>
                        )}
                    </nav>
                </aside>

                {/* Mobile Nav Trigger */}
                <div className="md:hidden fixed top-3 right-3 z-200">
                    <button 
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-1.5 bg-black rounded-md border border-gray-800 text-white"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        ☰
                    </button>
                </div>

                {/* Main Content Area */}
                <main className={`sibau-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="sibau-page-title-section">
                        <h2>{subtitle ? subtitle : 'DASHBOARD SISTEM INFORMASI BERITA ACARA UJIAN'}</h2>
                        <p>Selamat Datang, {user.name} ({isAdmin ? 'Fakultas Ekonomi' : 'Dosen Pengawas'})</p>
                    </div>

                    {/* Page Content */}
                    <div className="sibau-page-content">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
