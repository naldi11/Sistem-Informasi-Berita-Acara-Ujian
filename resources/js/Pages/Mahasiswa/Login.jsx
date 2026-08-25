import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        nim: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('mahasiswa.login.submit'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="login-page-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff', color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Head title="Login Mahasiswa - BERITA UJIAN" />

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
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '12px', fontSize: '20pt', fontWeight: 'bold', marginBottom: '20px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>M</div>
                    <h1 style={{ fontSize: '32pt', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>BERITA UJIAN</h1>
                    <p style={{ fontSize: '14pt', color: '#a7f3d0', marginTop: '6px', fontWeight: '500' }}>Portal Absensi Mandiri Mahasiswa</p>
                    <p style={{ fontSize: '11pt', color: '#34d399', marginTop: '2px' }}>Universitas Methodist Indonesia – Fakultas Ekonomi</p>

                    <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>📅</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Lihat Jadwal Ujian Kapan Saja</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Akses daftar jadwal ujian Anda yang akan datang maupun yang telah selesai secara real-time.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>✍️</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Tanda Tangan & Absensi Digital</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Lakukan verifikasi kehadiran mandiri langsung menggunakan tanda tangan digital.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '20pt' }}>🛡️</span>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700' }}>Verifikasi Keamanan Multi-Lapis</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>Keamanan absensi terjamin melalui validasi Token Ruangan, Geofencing, dan IP Kampus.</p>
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
                    <h2 style={{ fontSize: '22pt', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Portal Mahasiswa 👋</h2>
                    <p style={{ color: '#4b5563', marginTop: '6px', fontSize: '10pt', marginBottom: '32px' }}>Masukkan NIM dan Kata Sandi Anda untuk masuk ke Dashboard.</p>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label htmlFor="nim" style={{ display: 'block', fontSize: '9.5pt', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>NIM (Nomor Induk Mahasiswa)</label>
                            <input
                                id="nim"
                                type="text"
                                name="nim"
                                value={data.nim}
                                onChange={(e) => setData('nim', e.target.value)}
                                placeholder="Masukkan NIM Anda"
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
                            <InputError message={errors.nim} style={{ marginTop: '6px' }} />
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
                                    placeholder="Masukkan kata sandi Anda"
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
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        fontSize: '11pt',
                                        color: '#6b7280'
                                    }}
                                >
                                    {showPassword ? '👁️' : '🙈'}
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
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '10.5pt',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                transition: 'transform 0.1s, opacity 0.2s',
                                opacity: processing ? 0.7 : 1
                            }}
                        >
                            {processing ? 'Memverifikasi...' : 'Masuk Portal'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                        <Link href={route('login')} style={{ fontSize: '9pt', color: '#4b5563', textDecoration: 'none', fontWeight: '600' }}>
                            🔐 Login Dosen / Pengawas Ujian
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
