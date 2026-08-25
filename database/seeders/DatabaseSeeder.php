<?php

namespace Database\Seeders;

use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Data awal SIBAU: satu akun administrator fakultas dan daftar program studi.
 *
 * Data operasional (dosen, mahasiswa, mata kuliah, jadwal ujian) tidak diseed
 * di sini — semuanya diimpor lewat menu Import Excel di aplikasi.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SIBAU_ADMIN_EMAIL', 'admin@umi.ac.id');
        $password = env('SIBAU_ADMIN_PASSWORD');

        if (!$password) {
            $this->command?->warn(
                'SIBAU_ADMIN_PASSWORD belum diisi di .env — memakai kata sandi sementara "password". '
                . 'Segera ubah lewat menu Pengaturan setelah login pertama.'
            );
            $password = 'password';
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin Fakultas',
                'password' => Hash::make($password),
                'role' => 'admin',
                'status' => 'aktif',
            ]
        );

        $this->command?->info("Akun administrator: {$email}");

        $prodis = [
            ['kode_prodi' => 'MNJ', 'nama_prodi' => 'S1 Manajemen'],
            ['kode_prodi' => 'AKT', 'nama_prodi' => 'S1 Akuntansi'],
            ['kode_prodi' => 'MIA', 'nama_prodi' => 'D3 Manajemen Informatika'],
            ['kode_prodi' => 'KAA', 'nama_prodi' => 'D3 Komputerisasi Akuntansi'],
        ];

        foreach ($prodis as $prodi) {
            ProgramStudi::updateOrCreate(
                ['kode_prodi' => $prodi['kode_prodi']],
                $prodi + ['fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif']
            );
        }
    }
}
