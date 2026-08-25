import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function PanduanDosen() {
    return (
        <AuthenticatedLayout subtitle="Panduan Penggunaan Portal Pengawas - BERITA UJIAN">
            <Head title="Panduan Pengawas - BERITA UJIAN" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Welcome Card & Overview */}
                <div className="sibau-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16pt', fontWeight: '800', letterSpacing: '0.5px' }}>📖 PANDUAN PENGGUNAAN PORTAL PENGAWAS</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#c7d2fe' }}>
                                Panduan langkah-langkah pengisian Berita Acara Ujian (BAU) dan absensi mahasiswa secara digital
                            </p>
                        </div>
                    </div>
                    <div style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#e2e8f0', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                        Selamat datang di <strong>Portal Pengawas BERITA UJIAN</strong>. Sistem ini dirancang untuk memudahkan Anda mengelola jadwal mengawas, melakukan absensi mahasiswa secara real-time di ruang ujian, serta mengirimkan laporan Berita Acara Ujian (BAU) ke pihak Administrasi Fakultas Ekonomi secara instan tanpa perlu berkas fisik manual.
                    </div>
                </div>

                {/* Workflow Steps for Dosen/Pengawas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    
                    {/* STEP 1: Cek Jadwal Mengawas */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 1</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📅 Memeriksa Jadwal Mengawas Ujian</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Jadwal Mengawas</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Sebelum pelaksanaan ujian, Anda dapat memeriksa daftar hari, tanggal, jam, ruangan, dan mata kuliah ujian yang ditugaskan kepada Anda.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #6366f1', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Cara Memeriksa Jadwal:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Buka menu <strong>Jadwal Mengawas</strong> pada sidebar.</li>
                                    <li>Di sini, Anda dapat melihat seluruh agenda tugas mengawas Anda, lengkap dengan status ujian (<code>terjadwal</code>, <code>berlangsung</code>, atau <code>selesai</code>).</li>
                                    <li>Klik tombol **Detail Peserta** (👥) untuk melihat daftar mahasiswa kelas tersebut yang terdaftar sebagai peserta ujian.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                                    {/* STEP 2: Input Berita Acara & Absen Mahasiswa */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 2</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📝 Pengisian Absensi & Berita Acara</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: BAU Pengawas</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Pada hari pelaksanaan ujian, Anda wajib mengisi data kehadiran mahasiswa dan detail pelaksanaan ujian melalui portal ini.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #6366f1', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Cara Mengisi Laporan BAU:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Pilih menu <strong>BAU Pengawas</strong>. Temukan jadwal ujian yang aktif hari ini.</li>
                                    <li>Klik tombol <strong>✏️ Input Berita Acara</strong> pada baris jadwal yang sesuai.</li>
                                    <li><strong>Verifikasi Waktu:</strong> Isi jam mulai aktual dan jam selesai aktual pelaksanaan ujian.</li>
                                    <li><strong>Absensi Mahasiswa:</strong> Tandai kehadiran masing-masing mahasiswa (hadir, sakit, izin, atau alfa). Secara default, mahasiswa berstatus belum ditentukan.</li>
                                    <li><strong>Catatan Kejadian:</strong> Isi kolom catatan jika terdapat kejadian khusus (misal: lembar soal kurang, mahasiswa terlambat, atau tindakan kecurangan). Jika tidak ada, Anda dapat mengosongkannya.</li>
                                    <li><em>Catatan:</em> Dokumen PDF Berita Acara resmi yang dicetak nantinya akan mencantumkan nama <strong>Dosen Pengampu mata kuliah</strong> (penanggung jawab perkuliahan) di bagian tanda tangan, bukan nama Anda selaku pengawas (kecuali jika Anda adalah Dosen Pengampu mata kuliah tersebut).</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* STEP 3: Menyimpan Laporan (Draft / Submit) */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 3</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>💾 Menyimpan Laporan (Draft / Submit)</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Status: Validasi</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Anda memiliki dua opsi saat menyelesaikan pengisian Berita Acara Ujian:
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '700', fontSize: '9.5pt', marginBottom: '6px' }}>
                                        <span>📂 Simpan Sebagai Draft</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '8.5pt', lineHeight: '1.5', color: '#475569' }}>
                                        Gunakan ini jika Anda masih mengisi absen dan ingin melanjutkannya nanti. Status akan tetap <code>draft</code> dan Admin belum bisa melihat atau memvalidasi laporan Anda.
                                    </p>
                                </div>
                                <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '8px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: '700', fontSize: '9.5pt', marginBottom: '6px' }}>
                                        <span>🚀 Kirim untuk Validasi (Submit)</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '8.5pt', lineHeight: '1.5', color: '#064e3b' }}>
                                        Gunakan opsi ini jika pengisian telah selesai. Status berubah menjadi <code>Menunggu Validasi</code>. Laporan akan dikirim ke Admin Fakultas untuk diperiksa. Jika laporan ditolak oleh Admin, status akan kembali menjadi <code>Draft</code> agar Anda dapat memperbaikinya.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* STEP 4: Validasi & Download PDF Berita Acara Resmi */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 4</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📄 Mengunduh PDF Berita Acara yang Tervalidasi</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Laporan Pengawas</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Setelah Admin menyetujui (memvalidasi) Berita Acara yang Anda kirimkan, dokumen tersebut akan masuk ke arsip laporan Anda.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #6366f1', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Cara Download PDF:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Buka menu <strong>Laporan Pengawas</strong>.</li>
                                    <li>Daftar berita acara yang telah berstatus <code>tervalidasi</code> oleh Admin akan muncul di tabel laporan.</li>
                                    <li>Klik tombol <strong>Cetak PDF (🖨️)</strong> pada baris laporan untuk melihat atau mengunduh Berita Acara Ujian resmi berformat PDF.</li>
                                    <li>Dokumen PDF yang diunduh sudah lengkap secara formal dan siap digunakan sebagai bukti pelaporan tugas mengawas Anda.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
