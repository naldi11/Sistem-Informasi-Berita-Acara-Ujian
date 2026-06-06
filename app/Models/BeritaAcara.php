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
}
