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
            'password' => bcrypt('password'),
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

    public function test_can_schedule_any_dosen_as_supervisor(): void
    {
        // 1. Create a course (Praktek)
        $course = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // 2. Schedule exam with John Doe as supervisor for class A (he is the ampu lecturer, but there is no restriction anymore)
        $response = $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), [
                'kode_mk' => 'MAK101',
                'nip_dosen' => '19850312001',
                'tanggal' => date('Y-m-d', strtotime('+1 day')),
                'jam_mulai' => '13:30',
                'jam_selesai' => '15:00',
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

    public function test_can_schedule_custom_manual_time_without_fixed_slot_or_rest_hour_restriction(): void
    {
        $course = MataKuliah::create([
            'kode_mk' => 'TEO101',
            'nama_mk' => 'Teori Ekonomi Macro',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // Schedule Teori during rest hour window (11:00 - 12:30) manually
        $response = $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), [
                'kode_mk' => 'TEO101',
                'nip_dosen' => '19850312001',
                'tanggal' => date('Y-m-d', strtotime('+1 day')),
                'jam_mulai' => '11:00',
                'jam_selesai' => '12:30',
                'ruang' => 'R.101',
                'kelas' => 'A',
                'jenis_ujian' => 'UTS',
                'semester_aktif' => 'Ganjil 2025/2026',
                'tahun_akademik' => '2025/2026',
                'student_nims' => ['2101010001'],
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('jadwal_ujians', [
            'kode_mk' => 'TEO101',
            'jam_mulai' => '11:00',
            'jam_selesai' => '12:30',
        ]);
    }

    public function test_cannot_schedule_overlapping_room(): void
    {
        $course1 = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        $course2 = MataKuliah::create([
            'kode_mk' => 'MAK102',
            'nama_mk' => 'Mata Kuliah Lain Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // Create first schedule: 13:30 - 15:00 in Room 'R.301'
        $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        // Try to create second schedule for DIFFERENT course MAK102 in same room 'R.301' overlapping time: 13:30 - 15:00
        $response = $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK102',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        $response->assertSessionHasErrors('ruang');
    }

    public function test_cannot_schedule_overlapping_lecturer(): void
    {
        $course1 = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        $course2 = MataKuliah::create([
            'kode_mk' => 'MAK102',
            'nama_mk' => 'Mata Kuliah Lain Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // Create first schedule: 13:30 - 15:00 with John Doe ('19850312001') in Room 'R.301'
        $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        // Try to create second schedule for DIFFERENT course MAK102 with same lecturer '19850312001' overlapping time in different room 'R.302'
        $response = $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK102',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.302',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        $response->assertSessionHasErrors('nip_dosen');
    }

    public function test_cannot_schedule_overlapping_student(): void
    {
        $course = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi Praktek',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // Create first schedule with Jane Smith ('2101010001')
        $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        // Try to create second schedule with same student ('2101010001') overlapping time, different room and different lecturer
        // Create second lecturer
        Dosen::create([
            'nip' => '19850312002',
            'nama' => 'Dr. Bob Smith, M.Si.',
            'kode_prodi' => 'AKT',
            'status' => 'aktif',
        ]);

        $response = $this->actingAs($this->admin)->post(route('admin.jadwal.store'), [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312002',
            'tanggal' => date('Y-m-d', strtotime('+1 day')),
            'jam_mulai' => '13:30',
            'jam_selesai' => '15:00',
            'ruang' => 'R.302',
            'kelas' => 'B',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ]);

        $response->assertSessionHasErrors('student_nims');
    }
}
