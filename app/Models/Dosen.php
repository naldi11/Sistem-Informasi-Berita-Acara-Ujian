<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dosen extends Model
{
    use HasFactory;

    protected $table = 'dosens';
    protected $primaryKey = 'nip';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nip',
        'nama',
        'kode_prodi',
        'jabatan',
        'status',
    ];

    protected $casts = [
    ];

    public function programStudi()
    {
        return $this->belongsTo(ProgramStudi::class, 'kode_prodi', 'kode_prodi');
    }

    public function jadwalUjians()
    {
        return $this->hasMany(JadwalUjian::class, 'nip_dosen', 'nip');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'nip', 'nip');
    }
}
