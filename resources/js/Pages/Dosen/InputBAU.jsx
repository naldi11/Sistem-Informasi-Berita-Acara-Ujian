import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Simple HTML5 Canvas Signature Pad Component
function SignaturePad({ value, onChange }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#1d4ed8'; // Blue ink signature
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = value;
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [value]);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL();
            onChange(dataUrl);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onChange(null);
        }
    };

    return (
        <div className="sibau-sig-container">
            <canvas
                ref={canvasRef}
                className="sibau-sig-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                width="200"
                height="100"
            />
            <button type="button" onClick={clearCanvas} className="sibau-sig-clear">Hapus</button>
        </div>
    );
}

export default function InputBAU({ schedule }) {
    const bau = schedule.berita_acara;
    
    // Build initial states
    const initialAttendance = {};
    const initialNilai = {};
    const initialSignatures = {};

    schedule.peserta_ujians.forEach(p => {
        initialAttendance[p.nim] = p.kehadiran === 'belum_ditentukan' ? 'hadir' : p.kehadiran;
        initialNilai[p.nim] = p.nilai !== null ? p.nilai : '';
        initialSignatures[p.nim] = p.tanda_tangan || null;
    });

    const form = useForm({
        jam_mulai_aktual: bau ? bau.jam_mulai_aktual.substring(0, 5) : schedule.jam_mulai.substring(0, 5),
        jam_selesai_aktual: bau ? bau.jam_selesai_aktual.substring(0, 5) : schedule.jam_selesai.substring(0, 5),
        catatan: bau ? (bau.catatan || '') : '',
        status_validasi: 'draft',
        attendance: initialAttendance,
        nilai: initialNilai,
        signatures: initialSignatures,
    });

    const handleAttendanceChange = (nim, val) => {
        const updated = { ...form.data.attendance, [nim]: val };
        form.setData('attendance', updated);
    };

    const handleNilaiChange = (nim, val) => {
        const updated = { ...form.data.nilai, [nim]: val };
        form.setData('nilai', updated);
    };

    const handleSignatureChange = (nim, val) => {
        const updated = { ...form.data.signatures, [nim]: val };
        form.setData('signatures', updated);
    };

    const submit = (status) => {
        form.data.status_validasi = status;
        
        let totalHadir = 0;
        let missingSigs = 0;
        
        Object.keys(form.data.attendance).forEach(nim => {
            if (form.data.attendance[nim] === 'hadir') {
                totalHadir++;
                if (status === 'menunggu_validasi' && !form.data.signatures[nim]) {
                    missingSigs++;
                }
            }
        });

        if (status === 'menunggu_validasi' && missingSigs > 0) {
            if (!confirm(`Ada ${missingSigs} mahasiswa yang belum tanda tangan. Apakah Anda tetap ingin mengirim berita acara?`)) {
                return;
            }
        }

        form.post(route('dosen.berita-acara.save', { jadwal_id: schedule.id }));
    };

    // Calculate totals
    const totalStudents = schedule.peserta_ujians.length;
    const totalHadir = Object.values(form.data.attendance).filter(v => v === 'hadir').length;
    const totalAbsen = Object.values(form.data.attendance).filter(v => v === 'absen').length;

    return (
        <AuthenticatedLayout subtitle="Sistem Informasi Berita Acara Ujian">
            <Head title="Input Berita Acara Ujian (BAU) - SIBAU" />

            <div style={{ marginBottom: '20px' }}>
                <Link href={route('dosen.berita-acara')} className="sibau-btn sibau-btn-secondary sibau-btn-sm" style={{ textDecoration: 'none' }}>← Batal</Link>
            </div>

            {/* Input Header Panel (Gambar 3.9) */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
                    INPUT BERITA ACARA UJIAN (BAU)
                </h3>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', fontSize: '10pt', color: 'var(--text-main)' }}>
                    <div>
                        <strong>Mata Kuliah:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.mata_kuliah.nama_mk}</span>
                    </div>
                    <div>
                        <strong>Kelas:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.kelas}</span>
                    </div>
                    <div>
                        <strong>Tanggal:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.tanggal}</span>
                    </div>
                    <div>
                        <strong>Ruang:</strong> <span style={{ marginLeft: '6px', fontWeight: '600' }}>{schedule.ruang}</span>
                    </div>
                </div>
            </div>

            {/* Actual Times Card */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px' }}>WAKTU AKTUAL PELAKSANAAN</h3>
                <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="sibau-label">Jam Mulai Ujian</label>
                        <input 
                            type="time" 
                            className="sibau-input" 
                            value={form.data.jam_mulai_aktual} 
                            onChange={e => form.setData('jam_mulai_aktual', e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="sibau-label">Jam Selesai Ujian</label>
                        <input 
                            type="time" 
                            className="sibau-input" 
                            value={form.data.jam_selesai_aktual} 
                            onChange={e => form.setData('jam_selesai_aktual', e.target.value)} 
                            required 
                        />
                    </div>
                </div>
            </div>

            {/* Split Tables: Mahasiswa List & Grades/Signatures (Gambar 3.9 style) */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Daftar Absensi & Nilai Mahasiswa Ujian
                </h3>

                <div className="sibau-table-container">
                    <table className="sibau-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5%', textAlign: 'center' }}>No</th>
                                <th style={{ width: '15%' }}>NPM / NIM</th>
                                <th style={{ width: '30%' }}>Nama Mahasiswa</th>
                                <th style={{ width: '18%', textAlign: 'center' }}>Hadir/Absen</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>Nilai Ujian</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Tanda Tangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.peserta_ujians.map((peserta, idx) => {
                                const nim = peserta.nim;
                                const currentStatus = form.data.attendance[nim];
                                return (
                                    <tr key={nim}>
                                        <td className="text-center">{idx + 1}.</td>
                                        <td style={{ fontFamily: 'monospace' }}>{nim}</td>
                                        <td style={{ fontWeight: '600' }}>{peserta.mahasiswa.nama}</td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input 
                                                        type="radio" 
                                                        name={`attendance_${nim}`} 
                                                        checked={currentStatus === 'hadir'} 
                                                        onChange={() => handleAttendanceChange(nim, 'hadir')} 
                                                    />
                                                    <span style={{ fontSize: '9.5pt' }}>Hadir</span>
                                                </label>
                                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-danger)' }}>
                                                    <input 
                                                        type="radio" 
                                                        name={`attendance_${nim}`} 
                                                        checked={currentStatus === 'absen'} 
                                                        onChange={() => handleAttendanceChange(nim, 'absen')} 
                                                    />
                                                    <span style={{ fontSize: '9.5pt' }}>Absen</span>
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            {currentStatus === 'hadir' ? (
                                                <input 
                                                    type="number" 
                                                    className="sibau-input text-center" 
                                                    style={{ padding: '6px', maxWidth: '80px', margin: '0 auto', display: 'block' }}
                                                    min="0" 
                                                    max="100" 
                                                    value={form.data.nilai[nim]} 
                                                    onChange={e => handleNilaiChange(nim, e.target.value)} 
                                                    placeholder="0"
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '9.5pt' }}>-</div>
                                            )}
                                        </td>
                                        <td>
                                            {currentStatus === 'hadir' ? (
                                                <SignaturePad 
                                                    value={form.data.signatures[nim]} 
                                                    onChange={(val) => handleSignatureChange(nim, val)} 
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '9.5pt' }}>✗ ABSEN</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes & Catatan Pelaksanaan */}
            <div className="sibau-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>CATATAN PELAKSANAAN UJIAN</h3>
                <textarea 
                    className="sibau-textarea" 
                    placeholder="Tuliskan catatan kejadian penting selama ujian berlangsung..." 
                    value={form.data.catatan} 
                    onChange={e => form.setData('catatan', e.target.value)} 
                    style={{ minHeight: '100px' }}
                />
            </div>

            {/* Footer Statistics & Kirim Buttons (Gambar 3.9) */}
            <div className="sibau-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '24px', fontSize: '10pt', fontWeight: '700' }}>
                    <div>JUMLAH MAHASISWA: <span style={{ color: 'var(--text-main)', fontSize: '11pt' }}>{totalStudents}</span></div>
                    <div>HADIR: <span style={{ color: '#16a34a', fontSize: '11pt' }}>{totalHadir}</span></div>
                    <div>ABSEN: <span style={{ color: '#dc2626', fontSize: '11pt' }}>{totalAbsen}</span></div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        type="button" 
                        onClick={() => submit('draft')} 
                        className="sibau-btn sibau-btn-secondary"
                        disabled={form.processing}
                    >
                        Simpan Draft
                    </button>
                    <button 
                        type="button" 
                        onClick={() => submit('menunggu_validasi')} 
                        className="sibau-btn sibau-btn-primary"
                        disabled={form.processing}
                    >
                        KIRIM BERITA ACARA
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
