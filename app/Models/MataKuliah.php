<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    use HasFactory;

    protected $table = 'mata_kuliahs';
    protected $primaryKey = 'kode_mk';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_mk',
        'nama_mk',
        'sks',
        'kode_prodi',
        'semester',
        'status',
        'teori',
        'praktek',
    ];

    protected $casts = [
        'teori' => 'boolean',
        'praktek' => 'boolean',
    ];

    public function programStudi()
    {
        return $this->belongsTo(ProgramStudi::class, 'kode_prodi', 'kode_prodi');
    }

    public function jadwalUjians()
    {
        return $this->hasMany(JadwalUjian::class, 'kode_mk', 'kode_mk');
    }
}
