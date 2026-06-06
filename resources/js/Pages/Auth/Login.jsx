import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function Login({ status }) {
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
            <Head title="Log In - SIBAU" />

            {/* Left Column: Branding */}
            <div className="login-left-brand" style={{
                flex: 1.2,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
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
                    <h1 style={{ fontSize: '32pt', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>SIBAU</h1>
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
                    © {new Date().getFullYear()} SIBAU – Universitas Methodist Indonesia
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
                    <p style={{ color: '#4b5563', marginTop: '6px', fontSize: '10pt', marginBottom: '32px' }}>Silakan masuk ke akun SIBAU Anda.</p>

                    {status && (
                        <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '9.5pt', fontWeight: '500' }}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label htmlFor="email" style={{ display: 'block', fontSize: '9.5pt', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>NIP / Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan NIP atau Email"
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
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Masukkan password"
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
                                autoComplete="current-password"
                            />
                            <InputError message={errors.password} style={{ marginTop: '6px' }} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '10.5pt',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, opacity 0.2s',
                                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)'
                            }}
                        >
                            {processing ? 'Memproses...' : 'Masuk ke SIBAU'}
                        </button>
                    </form>

                    {/* Demo Accounts Card */}
                    <div style={{
                        marginTop: '40px',
                        padding: '18px',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1',
                        backgroundColor: '#f8fafc',
                    }}>
                        <h5 style={{ margin: 0, fontSize: '9.5pt', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Uji Coba Demo Login</h5>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '9pt', color: '#64748b' }}>
                            <div>
                                <strong style={{ color: '#334155' }}>Admin:</strong>
                                <div style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '4px 6px', borderRadius: '4px', marginTop: '2px' }}>
                                    Email: admin@umi.ac.id<br />
                                    Pass: password
                                </div>
                            </div>
                            {/* <div>
                                <strong style={{ color: '#334155' }}>Dosen (Pengawas):</strong>
                                <div style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '4px 6px', borderRadius: '4px', marginTop: '2px' }}>
                                    Email: dosen@umi.ac.id<br />
                                    Pass: password
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
