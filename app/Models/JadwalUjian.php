<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalUjian extends Model
{
    use HasFactory;

    protected $table = 'jadwal_ujians';

    protected $fillable = [
        'kode_mk',
        'nip_dosen',
        'tanggal',
        'sesi',
        'jam_mulai',
        'jam_selesai',
        'ruang',
        'kelas',
        'jenis_ujian',
        'semester_aktif',
        'tahun_akademik',
        'status',
    ];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, 'kode_mk', 'kode_mk');
    }

    public function dosen()
    {
        return $this->belongsTo(Dosen::class, 'nip_dosen', 'nip');
    }

    public function pesertaUjians()
    {
        return $this->hasMany(PesertaUjian::class, 'jadwal_ujian_id', 'id');
    }

    public function beritaAcara()
    {
        return $this->hasOne(BeritaAcara::class, 'jadwal_ujian_id', 'id');
    }
}
