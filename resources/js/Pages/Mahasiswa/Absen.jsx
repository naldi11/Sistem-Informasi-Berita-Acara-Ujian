import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';

export default function Absen({ schedule, settings }) {
    const { flash, errors: pageErrors, auth } = usePage().props;
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle, locating, success, error
    const [gpsCoords, setGpsCoords] = useState({ lat: null, lng: null });
    const [gpsError, setGpsError] = useState('');
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Form: Submit attendance
    const submitForm = useForm({
        nim: auth?.mahasiswa?.nim || '',
        nim: auth?.mahasiswa?.nim || '',
        jadwal_ujian_id: schedule.id,
        token: '',
        latitude: '',
        longitude: '',
    });

    // Request geolocation if required on mount
    useEffect(() => {
        if (settings.gps_enabled) {
            requestGeolocation();
        }
    }, []);

    // Geolocation retrieval
    const requestGeolocation = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            setGpsError('Browser Anda tidak mendukung deteksi lokasi (GPS).');
            return;
        }

        setGpsStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setGpsCoords({ lat, lng });
                submitForm.setData(data => ({
                    ...data,
                    latitude: lat,
                    longitude: lng,
                }));
                setGpsStatus('success');
            },
            (error) => {
                setGpsStatus('error');
                let msg = 'Gagal mengakses GPS.';
                if (error.code === error.PERMISSION_DENIED) {
                    msg = 'Izin GPS ditolak. Anda wajib memberikan izin lokasi untuk melakukan absensi.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = 'Lokasi GPS tidak tersedia.';
                } else if (error.code === error.TIMEOUT) {
                    msg = 'Waktu permintaan lokasi habis.';
                }
                setGpsError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Signature logic removed

    // Form submit
    const handleSubmitAttendance = (e) => {
        e.preventDefault();

        submitForm.post(route('mahasiswa.absen.submit'), {
            onSuccess: () => {
                // Handled by flash session redirect
            }
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            boxSizing: 'border-box'
        }}>
            <Head title="Verifikasi Absensi Ujian - BERITA UJIAN" />

            <div style={{
                maxWidth: '600px',
                width: '100%',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '30px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                boxSizing: 'border-box'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Link 
                        href={route('mahasiswa.dashboard')} 
                        style={{
                            color: '#94a3b8',
                            textDecoration: 'none',
                            fontSize: '9.5pt',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        ⬅️ Kembali ke Dashboard
                    </Link>
                    <span style={{
                        padding: '4px 10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontSize: '8pt',
                        fontWeight: '700'
                    }}>
                        ACTIVE WINDOW
                    </span>
                </div>

                {/* Exam Details Card */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '28px'
                }}>
                    <div style={{ fontSize: '8pt', color: '#10b981', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Detail Ujian Terpilih</div>
                    <h3 style={{ fontSize: '13pt', fontWeight: '800', margin: '4px 0 12px 0', color: '#ffffff' }}>{schedule.nama_mk}</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '9.5pt' }}>
                        <div>
                            <span style={{ color: '#64748b' }}>Kode MK:</span>
                            <div style={{ fontWeight: '600', color: '#cbd5e1', marginTop: '2px' }}>{schedule.kode_mk}</div>
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>Ruang / Kelas:</span>
                            <div style={{ fontWeight: '600', color: '#cbd5e1', marginTop: '2px' }}>{schedule.ruang} / Kelas {schedule.kelas}</div>
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>Waktu Pelaksanaan:</span>
                            <div style={{ fontWeight: '600', color: '#cbd5e1', marginTop: '2px' }}>{schedule.jam_mulai} - {schedule.jam_selesai} WIB</div>
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>Pengawas Ujian:</span>
                            <div style={{ fontWeight: '600', color: '#cbd5e1', marginTop: '2px' }}>{schedule.dosen_nama}</div>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '9.5pt',
                        fontWeight: '600',
                        marginBottom: '20px'
                    }}>
                        ❌ {flash.error}
                    </div>
                )}
                {pageErrors.error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#f87171',
                        fontSize: '9.5pt',
                        fontWeight: '600',
                        marginBottom: '20px'
                    }}>
                        ❌ {pageErrors.error}
                    </div>
                )}

                {/* Geolocation Section */}
                {settings.gps_enabled && (
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9.5pt', fontWeight: '700', color: '#cbd5e1' }}>🌐 Deteksi GPS Geofencing</span>
                            {gpsStatus === 'locating' && <span style={{ color: '#60a5fa', fontSize: '9pt', fontWeight: '600' }}>📡 Mendeteksi...</span>}
                            {gpsStatus === 'success' && <span style={{ color: '#34d399', fontSize: '9pt', fontWeight: '600' }}>✅ Lokasi Terkunci</span>}
                            {gpsStatus === 'error' && <span style={{ color: '#f87171', fontSize: '9pt', fontWeight: '600' }}>⚠️ Eror GPS</span>}
                        </div>
                        {gpsStatus === 'success' && (
                            <div style={{ fontSize: '8.5pt', color: '#94a3b8', marginTop: '6px' }}>
                                Koordinat Anda: <code style={{ color: '#cbd5e1' }}>{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</code> (Memenuhi syarat radius kampus)
                            </div>
                        )}
                        {gpsStatus === 'error' && (
                            <div style={{ fontSize: '8.5pt', color: '#f87171', marginTop: '6px', fontWeight: '600' }}>
                                {gpsError}
                                <button type="button" onClick={requestGeolocation} style={{ marginLeft: '10px', background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', fontWeight: '700', fontSize: '8.5pt' }}>Coba Lagi</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Absen Form */}
                <form onSubmit={handleSubmitAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Token Input */}
                    {settings.token_enabled && (
                        <div>
                            <label htmlFor="token" style={{ display: 'block', fontSize: '9.5pt', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>🔑 Masukkan Token Ruangan</label>
                            <input 
                                id="token"
                                type="text"
                                value={submitForm.data.token}
                                onChange={e => submitForm.setData('token', e.target.value)}
                                placeholder="Masukkan 6 digit token dari pengawas"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                    fontSize: '10pt',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    textTransform: 'uppercase'
                                }}
                                maxLength={10}
                                required
                            />
                            {pageErrors.token && <div style={{ color: '#f87171', fontSize: '9pt', marginTop: '4px', fontWeight: '600' }}>{pageErrors.token}</div>}
                        </div>
                    )}



                    {/* Submit Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <Link 
                            href={route('mahasiswa.dashboard')}
                            style={{
                                flex: 1,
                                padding: '14px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1',
                                borderRadius: '8px',
                                fontSize: '10pt',
                                fontWeight: '700',
                                textDecoration: 'none',
                                textAlign: 'center',
                                display: 'inline-block'
                            }}
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={submitForm.processing || (settings.gps_enabled && gpsStatus !== 'success')}
                            style={{
                                flex: 2,
                                padding: '14px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '10pt',
                                fontWeight: '700',
                                cursor: (submitForm.processing || (settings.gps_enabled && gpsStatus !== 'success')) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                opacity: (submitForm.processing || (settings.gps_enabled && gpsStatus !== 'success')) ? 0.6 : 1
                            }}
                        >
                            {submitForm.processing ? 'Mengirim Absensi...' : (settings.gps_enabled && gpsStatus !== 'success') ? 'Menunggu GPS...' : 'Kirim Absensi Ujian'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
