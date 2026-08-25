import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Login({ status }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="login-page-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff', color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Head title="Log In - BERITA UJIAN" />

            {/* Left Column: Branding */}
            <div className="login-left-brand" style={{
                flex: 1.2,
                background: 'linear-gradient(135deg, #153254 0%, #1c3e66 40%, #2b5886 75%, #38699a 100%)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background glow effects */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(80px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(90px)' }}></div>

                <div style={{ zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '12px', fontSize: '20pt', fontWeight: 'bold', marginBottom: '20px', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>S</div>
                    <h1 style={{ fontSize: '32pt', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>BERITA UJIAN</h1>
                    <p style={{ fontSize: '14pt', color: '#93c5fd', marginTop: '6px', fontWeight: '500' }}>Sistem Informasi Berita Acara Ujian</p>
                    <p style={{ fontSize: '11pt', color: '#60a5fa', marginTop: '2px' }}>Universitas Methodist Indonesia – Fakultas Ekonomi</p>

                    <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>📝</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Input & kelola Berita Acara Ujian digital</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Pengisian berita acara langsung dari ruang ujian secara paperless.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>👥</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Rekap kehadiran mahasiswa otomatis</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Absensi real-time terintegrasi langsung dengan database peserta.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>📄</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Laporan lengkap dalam format PDF & Excel</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Generate rekap laporan dalam satu klik, siap dicetak dan didistribusikan.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>🛡️</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Validasi BAU oleh Kaprodi secara digital</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Verifikasi keabsahan data berita acara oleh pimpinan program studi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '30px', left: '60px', fontSize: '8.5pt', color: '#475569', zIndex: 2 }}>
                    © {new Date().getFullYear()} BERITA UJIAN – Universitas Methodist Indonesia
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="login-right-form" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                backgroundColor: '#ffffff'
            }}>
                <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '22pt', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Selamat Datang 👋</h2>
                    <p style={{ color: '#4b5563', marginTop: '6px', fontSize: '10pt', marginBottom: '32px' }}>Silakan masuk ke akun BERITA UJIAN Anda.</p>

                    {status && (
                        <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '9.5pt', fontWeight: '500' }}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label htmlFor="email" style={{ display: 'block', fontSize: '9.5pt', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>NIDN / Email</label>
                            <input
                                id="email"
                                type="text"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan NIDN atau Email"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '10pt',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                required
                                autoComplete="username"
                            />
                            <InputError message={errors.email} style={{ marginTop: '6px' }} />
                        </div>

                        <div>
                            <label htmlFor="password" style={{ display: 'block', fontSize: '9.5pt', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Kata Sandi</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 14px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '10pt',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                        outline: 'none'
                                    }}
                                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} style={{ marginTop: '6px' }} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #1e4b82 0%, #2b5886 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '10.5pt',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, opacity 0.2s',
                                boxShadow: '0 4px 12px rgba(30, 75, 130, 0.25)'
                            }}
                        >
                            {processing ? 'Memproses...' : 'Masuk ke BERITA UJIAN'}
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                            <span style={{ padding: '0 10px', fontSize: '9pt', color: '#9ca3af', fontWeight: '500' }}>ATAU</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                        </div>

                        <a
                            href={route('mahasiswa.login')}
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                width: '100%',
                                padding: '12px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '8px',
                                color: '#16a34a',
                                fontSize: '10pt',
                                fontWeight: '700',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s, color 0.2s',
                                boxSizing: 'border-box'
                            }}
                        >
                            🎓 Portal Absensi Ujian Mahasiswa
                        </a>
                    </form>
                </div>
            </div>
        </div>
    );
}
