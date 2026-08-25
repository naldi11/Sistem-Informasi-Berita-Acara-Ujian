<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\ProgramStudi;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed default Admin
        $admin = User::create([
            'name' => 'Admin Fakultas',
            'email' => 'admin@umi.ac.id',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'aktif',
        ]);

        // 2. Seed default Program Studi
        $prodis = [
            ['kode_prodi' => 'MNJ', 'nama_prodi' => 'S1 Manajemen', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
            ['kode_prodi' => 'AKT', 'nama_prodi' => 'S1 Akuntansi', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
            ['kode_prodi' => 'MIA', 'nama_prodi' => 'D3 Manajemen Informatika', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
            ['kode_prodi' => 'KAA', 'nama_prodi' => 'D3 Komputerisasi Akuntansi', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
        ];
        foreach ($prodis as $p) {
            ProgramStudi::firstOrCreate(['kode_prodi' => $p['kode_prodi']], $p);
        }

    }
}
