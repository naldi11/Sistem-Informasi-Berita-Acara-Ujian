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
        'divalidasi_oleh',
        'divalidasi_pada',
        'diajukan_pada',
    ];

    protected $casts = [
        'divalidasi_pada' => 'datetime',
        'diajukan_pada' => 'datetime',
    ];

    public function jadwalUjian()
    {
        return $this->belongsTo(JadwalUjian::class, 'jadwal_ujian_id', 'id');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'divalidasi_oleh', 'id');
    }
}
