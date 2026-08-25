<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermohonanGantiPengawas extends Model
{
    use HasFactory;

    protected $table = 'permohonan_ganti_pengawas';

    protected $fillable = [
        'jadwal_ujian_id',
        'dosen_pemohon_nip',
        'alasan',
        'status',
        'dosen_pengganti_nip',
    ];

    public function jadwalUjian()
    {
        return $this->belongsTo(JadwalUjian::class, 'jadwal_ujian_id');
    }

    public function pemohon()
    {
        return $this->belongsTo(Dosen::class, 'dosen_pemohon_nip', 'nip');
    }

    public function pengganti()
    {
        return $this->belongsTo(Dosen::class, 'dosen_pengganti_nip', 'nip');
    }
}
