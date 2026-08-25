import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Panduan() {
    return (
        <AuthenticatedLayout subtitle="Panduan Penggunaan Sistem BERITA UJIAN">
            <Head title="Panduan Sistem - BERITA UJIAN" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Welcome Card & Overview */}
                <div className="sibau-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16pt', fontWeight: '800', letterSpacing: '0.5px' }}>📖 PANDUAN PENGGUNAAN SISTEM BERITA UJIAN</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt', color: '#94a3b8' }}>
                                Alur kerja lengkap dan langkah detail administrasi data ujian & berita acara Fakultas Ekonomi
                            </p>
                        </div>
                    </div>
                    <div style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#cbd5e1', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                        <strong>BERITA UJIAN (Sistem Informasi Berita Acara Ujian)</strong> adalah platform terintegrasi untuk mengelola jadwal ujian, memvalidasi penunjukan pengawas ujian secara otomatis berdasarkan mata kuliah diampu, pengisian Berita Acara Ujian (BAU) oleh pengawas, hingga pencetakan laporan rekapitulasi resmi. Untuk menjaga integritas data, mohon ikuti urutan pengisian data di bawah ini.
                    </div>
                </div>

                {/* Workflow Timeline Steps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    
                    {/* STEP 1: Prodi & Kelas */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 1</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>🏫 Pengaturan Program Studi (Prodi) & Kelas</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Prodi</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Sebelum mengimpor mahasiswa atau membuat jadwal, Anda harus terlebih dahulu mendaftarkan Program Studi beserta <strong>daftar kelas aktif</strong> di bawah program studi tersebut.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Instruksi Penting:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Buka menu <strong>Prodi</strong> pada sidebar.</li>
                                    <li>Gunakan tombol <strong>+ Tambah Prodi Baru</strong> jika ada program studi baru yang belum terdaftar.</li>
                                    <li>Klik tombol <strong>✏️ Kelas</strong> pada prodi yang sesuai untuk mengelola (tambah/hapus) kelas-kelas yang aktif di prodi tersebut (contoh: <code>2AB</code>, <code>4AB</code>, <code>6AB</code>).</li>
                                    <li>Seluruh data Mahasiswa, Pengawas, dan Jadwal Ujian selanjutnya akan divalidasi merujuk pada nama kelas di Prodi ini.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                                   {/* STEP 2: Pengawas & Mahasiswa */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 2</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>👨‍🏫 Registrasi Akun Pengawas & Mahasiswa</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Pengawas &amp; Mahasiswa</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Daftarkan terlebih dahulu Dosen/Pengawas yang mengajar di program studi beserta data Mahasiswa aktif. Data Dosen ini diperlukan sebelum menginput Mata Kuliah karena setiap Mata Kuliah harus menunjuk <strong>Dosen Pengampu</strong>.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Instruksi Penting:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>
                                        <strong>Pengawas/Dosen:</strong> Daftarkan Pengawas Pengampu. Setiap Pengawas yang terdaftar akan otomatis dibuatkan akun pengguna (User) untuk login portal pengawas (default password: <code>password</code>).
                                    </li>
                                    <li>
                                        <strong>Mahasiswa:</strong> Daftarkan Mahasiswa aktif dan tempatkan mereka pada kelas yang sesuai dengan daftar kelas prodi.
                                    </li>
                                    <li>
                                        Pendaftaran dapat dilakukan secara manual satu per satu atau secara massal melalui fitur <strong>📁 Import Excel</strong> yang tersedia.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* STEP 3: Mata Kuliah */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 3</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📚 Pengisian Data Mata Kuliah & Dosen Pengampu</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Mata Kuliah</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Masukkan seluruh data Mata Kuliah yang diajarkan. Pada setiap mata kuliah, Anda wajib menentukan **Semester (1 - 8)** dan **Dosen Pengampu**.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Fitur Pencarian &amp; Filter Kurikulum Terbaru:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Pilih menu <strong>Mata Kuliah</strong>. Anda dapat menambahkan data manual atau impor berkas massal.</li>
                                    <li><strong>Multi-Filter:</strong> Gunakan kombinasi 3 filter di bagian atas halaman (Pencarian Kode/Nama MK, Filter Program Studi, dan Filter Semester 1 s.d. 8) untuk menyaring data kurikulum dengan cepat.</li>
                                    <li><strong>Pengurutan Otomatis:</strong> Data mata kuliah diurutkan secara hierarkis: Program Studi &rarr; Semester (1-8) &rarr; Kode MK &rarr; Nama MK &rarr; SKS &rarr; Dosen Pengampu.</li>
                                    <li>Informasi <strong>Dosen Pengampu</strong> secara otomatis akan dicantumkan pada dokumen PDF Berita Acara Ujian (BAU) sebagai penanggung jawab perkuliahan.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* STEP 4: Data Ujian */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 4</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📅 Pembuatan Jadwal Ujian & Penunjukan Pengawas</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Data Ujian</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Susun Jadwal Ujian (UTS/UAS) dengan menentukan Semester Aktif, Tahun Akademik, Tahap Sesi, Waktu, Ruangan, Kelas, serta menunjuk **Pengawas Ujian**.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Alur Form &amp; Validasi Otomatis Terkini:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li><strong>Semester Aktif &amp; T.A. (Dipilih Pertama):</strong> Pilih <code>Semester Aktif</code> (Ganjil/Genap) dan <code>Tahun Akademik</code> (misal: 2025/2026) di awal form menggunakan dropdown <code>SearchableSelect</code>.</li>
                                    <li><strong>Penyaringan MK Ganjil/Genap Otomatis:</strong> Saat memilih Semester Aktif <code>Ganjil</code>, opsi Mata Kuliah otomatis terfilter HANYA menampilkan mata kuliah semester ganjil (1, 3, 5, 7). Begitu pula jika <code>Genap</code>, hanya menampilkan semester genap (2, 4, 6, 8). Validator backend juga secara otomatis menolak jika ada ketidaksesuaian semester aktif &amp; semester mata kuliah.</li>
                                    <li><strong>Otomatisasi Tahap Ujian (Sesi):</strong> Memilih <em>Pilih Tahap Ujian (Sesi)</em> akan mengisikan Jam Mulai dan Jam Selesai secara otomatis sesuai durasi standar (Tahap 1: 08:30-10:00, Tahap 2: 10:30-12:00, Tahap 3: 13:00-15:00, Tahap 4: 15:30-17:30, Tahap 5: 18:00-19:30, Tahap 6: 19:30-21:00). Anda tetap dapat mengedit jam secara manual jika diperlukan.</li>
                                    <li><strong>Aturan Penunjukan Pengawas:</strong> Pengawas Ujian dapat ditunjuk dari dosen manapun, namun Dosen Pengampu mata kuliah dilarang menjadi pengawas ujian pada mata kuliah yang diampunya sendiri.</li>
                                    <li><strong>Pencegahan Bentrok Otomatis:</strong> Sistem secara ketat memeriksa dan menolak jika terjadi bentrok Ruangan, Dosen Pengawas, atau Peserta Mahasiswa pada jam &amp; tanggal yang sama.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* STEP 5: Berita Acara */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 5</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📝 Validasi Berita Acara Ujian (BAU) oleh Admin</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Berita Acara &amp; Data Ujian</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Setelah ujian selesai dilaksanakan dan Pengawas mengirimkan Laporan BAU, status jadwal ujian akan berubah menjadi <strong>MENUNGGU VALIDASI</strong>. Laporan ini harus divalidasi oleh Admin.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Fitur Validasi Cepat &amp; Detail:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Anda dapat memproses validasi melalui menu khusus <strong>Berita Acara (BAU)</strong> untuk memeriksa berkas secara lengkap, melihat jumlah mahasiswa hadir/absen, serta mengecek preview PDF Berita Acara sebelum ditandatangani.</li>
                                    <li>Untuk kepraktisan, Anda juga dapat menekan tombol pintasan <strong>Setujui</strong> atau <strong>Tolak</strong> secara langsung pada baris tabel di menu <strong>Data Ujian</strong> jika statusnya berada dalam antrean validasi.</li>
                                    <li>Jika status di-<strong>Setujui</strong> (Tervalidasi), status ujian akan otomatis menjadi <strong>Selesai</strong> dan laporan siap direkap. Jika di-<strong>Tolak</strong>, status kembali menjadi <strong>Draft</strong> agar pengawas dapat memperbaiki data absensi/kejadian di portal mereka.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* STEP 6: Laporan Rekap */}
                    <div className="sibau-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="sibau-badge badge-info" style={{ fontSize: '10pt', padding: '4px 10px', fontWeight: 'bold' }}>Langkah 6</span>
                                <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '700', color: '#1e293b' }}>📊 Rekapitulasi & Cetak PDF</h4>
                            </div>
                            <span style={{ fontSize: '8.5pt', color: '#64748b', fontWeight: '600' }}>Menu: Laporan</span>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '9.5pt', lineHeight: '1.6', color: '#334155', margin: '0 0 12px 0' }}>
                                Seluruh berita acara ujian yang telah disetujui dapat direkapitulasi secara otomatis menjadi berkas laporan PDF atau Excel untuk keperluan arsip fakultas.
                            </p>
                            <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #0284c7', fontSize: '9pt', color: '#334155' }}>
                                <strong>💡 Cara Export Laporan:</strong>
                                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', listStyleType: 'decimal', lineHeight: '1.5' }}>
                                    <li>Pilih menu <strong>Laporan</strong>.</li>
                                    <li>Gunakan panel penyaring di sebelah kanan untuk memilih rentang tanggal, program studi, jenis ujian (UTS/UAS), dan status berita acara.</li>
                                    <li>Tekan tombol **Cetak PDF** untuk menghasilkan berkas rekap PDF resmi.</li>
                                    <li>Dokumen PDF yang diunduh akan otomatis dilengkapi tanda tangan "Mengetahui, Dekan Fakultas Ekonomi" dengan identitas yang sah sesuai dengan data pejabat dekanat saat ini.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
