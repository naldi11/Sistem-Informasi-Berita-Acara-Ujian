<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BeritaAcara extends Model
{
    use HasFactory;

    protected $table = 'berita_acaras';

    protected $fillable = [
        'jadwal_ujian_id',
        'jam_mulai_aktual',
        'jam_selesai_aktual',
        'catatan',
        'jumlah_hadir',
        'jumlah_absen',
        'status_validasi',
        'file_pdf',
    ];

    public function jadwalUjian()
    {
        return $this->belongsTo(JadwalUjian::class, 'jadwal_ujian_id', 'id');
    }

    public function generateQrCode()
    {
        $days = ['Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu'];
        $months = ['01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April', '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus', '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'];

        $dt = new \DateTime($this->jadwalUjian->tanggal);
        $dayName = $days[$dt->format('l')] ?? '';
        $dayNum = $dt->format('d');
        $monthName = $months[$dt->format('m')] ?? '';
        $year = $dt->format('Y');

        $statusMap = [
            'draft' => 'Draft / Belum Dikirim',
            'menunggu_validasi' => 'Menunggu Validasi Admin',
            'tervalidasi' => 'SAH / Terverifikasi Admin',
        ];
        $statusText = $statusMap[$this->status_validasi] ?? strtoupper($this->status_validasi);
        $totalPeserta = $this->jumlah_hadir + $this->jumlah_absen;
        
        $validationHash = strtoupper(md5("BAU-{$this->id}-{$this->jadwalUjian->tanggal}-{$this->jadwalUjian->dosen->nip}"));
        $shortHash = substr($validationHash, 0, 8) . '-' . substr($validationHash, 8, 8);

        $qrData = "LEGALISASI DIGITAL BERITA UJIAN\n"
                . "--------------------------------------\n"
                . "Dokumen ini sah dinyatakan sebagai pengganti tanda tangan basah.\n\n"
                . "Status Validasi: {$statusText}\n"
                . "No. Berita Acara: BAU-{$this->id}\n"
                . "Pengawas Ujian: {$this->jadwalUjian->dosen->nama}\n"
                . "NIDN: {$this->jadwalUjian->dosen->nip}\n"
                . "Mata Kuliah: {$this->jadwalUjian->mataKuliah->nama_mk} ({$this->jadwalUjian->mataKuliah->kode_mk})\n"
                . "Kelas / Ruang: {$this->jadwalUjian->kelas} / {$this->jadwalUjian->ruang}\n"
                . "Hari/Tanggal: {$dayName}, {$dayNum} {$monthName} {$year}\n"
                . "Waktu Aktual: " . substr($this->jam_mulai_aktual, 0, 5) . " - " . substr($this->jam_selesai_aktual, 0, 5) . " WIB\n"
                . "Jumlah Mahasiswa: {$totalPeserta} (Hadir: {$this->jumlah_hadir}, Absen: {$this->jumlah_absen})\n"
                . "Kode Verifikasi: {$shortHash}\n"
                . "--------------------------------------\n"
                . "Diverifikasi secara digital oleh Sistem Informasi Berita Acara Ujian (BERITA UJIAN).";

        $options = new \chillerlan\QRCode\QROptions([
            'outputInterface' => \chillerlan\QRCode\Output\QRGdImagePNG::class,
            'outputBase64' => true,
            'scale' => 4,
            'addQuietzone' => true,
            'quietzoneSize' => 2,
        ]);
        $qrcode = new \chillerlan\QRCode\QRCode($options);
        return $qrcode->render($qrData);
    }
}
