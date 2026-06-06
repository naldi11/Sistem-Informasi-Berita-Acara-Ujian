<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramStudi extends Model
{
    use HasFactory;

    protected $table = 'program_studis';
    protected $primaryKey = 'kode_prodi';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_prodi',
        'nama_prodi',
        'fakultas',
        'status',
        'daftar_kelas',
    ];

    protected $casts = [
        'daftar_kelas' => 'array',
    ];

    public function dosens()
    {
        return $this->hasMany(Dosen::class, 'kode_prodi', 'kode_prodi');
    }

    public function mahasiswas()
    {
        return $this->hasMany(Mahasiswa::class, 'kode_prodi', 'kode_prodi');
    }

    public function mataKuliahs()
    {
        return $this->hasMany(MataKuliah::class, 'kode_prodi', 'kode_prodi');
    }
}
