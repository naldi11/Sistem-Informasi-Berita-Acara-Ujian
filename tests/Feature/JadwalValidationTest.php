<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\ProgramStudi;
use App\Models\Mahasiswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JadwalValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $prodi;
    protected $dosen;
    protected $mahasiswa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);

        $this->prodi = ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);

        $this->dosen = Dosen::create([
            'nip' => '19850312001',
            'nama' => 'Dr. John Doe, M.Si.',
            'kode_prodi' => 'AKT',
            'status' => 'aktif',
            'ampu_mata_kuliah' => ['MAK101'],
            'ampu_kelas' => ['A'],
        ]);

        User::create([
            'nip' => '19850312001',
            'name' => 'Dr. John Doe, M.Si.',
            'email' => 'johndoe@umi.ac.id',
            'password' => bcrypt('password123'),
            'role' => 'dosen',
            'status' => 'aktif',
        ]);

        $this->mahasiswa = Mahasiswa::create([
            'nim' => '2101010001',
            'nama' => 'Jane Smith',
            'kode_prodi' => 'AKT',
            'angkatan' => '2024',
            'kelas' => 'A',
            'status' => 'aktif',
        ]);
    }

    public function test_cannot_schedule_dosen_pengampu_for_theory_only_course_in_their_class(): void
    {
        // 1. Create a theory-only course
        $courseTeori = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'teori' => true,
            'praktek' => false,
            'status' => 'aktif',
        ]);

        // 2. Try to schedule exam with John Doe as supervisor for class A
        $response = $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), [
                'kode_mk' => 'MAK101',
                'nip_dosen' => '19850312001',
                'tanggal' => date('Y-m-d', strtotime('+1 day')),
                'jam_mulai' => '08:30',
                'jam_selesai' => '10:00',
                'ruang' => 'R.301',
                'kelas' => 'A',
                'jenis_ujian' => 'UTS',
                'semester_aktif' => 'Ganjil 2025/2026',
                'tahun_akademik' => '2025/2026',
                'student_nims' => ['2101010001'],
            ]);

        $response->assertSessionHasErrors('nip_dosen');
    }

    public function test_can_schedule_dosen_pengampu_for_practical_course(): void
    {
        // 1. Create a course with practical component (teori=true, praktek=true)
        $coursePraktek = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'teori' => true,
            'praktek' => true,
            'status' => 'aktif',
        ]);

        // 2. Try to schedule exam with John Doe as supervisor for class A
        $response = $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), [
                'kode_mk' => 'MAK101',
                'nip_dosen' => '19850312001',
                'tanggal' => date('Y-m-d', strtotime('+1 day')),
                'jam_mulai' => '08:30',
                'jam_selesai' => '10:00',
                'ruang' => 'R.301',
                'kelas' => 'A',
                'jenis_ujian' => 'UTS',
                'semester_aktif' => 'Ganjil 2025/2026',
                'tahun_akademik' => '2025/2026',
                'student_nims' => ['2101010001'],
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('jadwal_ujians', [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'kelas' => 'A',
        ]);
    }

    public function test_can_schedule_dosen_pengampu_for_theory_only_course_in_different_class(): void
    {
        // 1. Create a theory-only course
        $courseTeori = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'teori' => true,
            'praktek' => false,
            'status' => 'aktif',
        ]);

        // 2. Try to schedule exam with John Doe as supervisor for class B (which they don't ampu)
        $response = $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), [
                'kode_mk' => 'MAK101',
                'nip_dosen' => '19850312001',
                'tanggal' => date('Y-m-d', strtotime('+1 day')),
                'jam_mulai' => '08:30',
                'jam_selesai' => '10:00',
                'ruang' => 'R.301',
                'kelas' => 'B',
                'jenis_ujian' => 'UTS',
                'semester_aktif' => 'Ganjil 2025/2026',
                'tahun_akademik' => '2025/2026',
                'student_nims' => ['2101010001'],
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('jadwal_ujians', [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'kelas' => 'B',
        ]);
    }
}
