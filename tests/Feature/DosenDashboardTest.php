<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\ProgramStudi;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\JadwalUjian;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DosenDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup ProgramStudi
        ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);

        // Setup MataKuliah
        MataKuliah::create([
            'kode_mk' => 'MK-001',
            'nama_mk' => 'Pengenalan Dasar Komputer',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);
    }

    public function test_dosen_dashboard_displays_ongoing_schedules(): void
    {
        // Create lecturer user and Dosen profile
        $user = User::factory()->create([
            'role' => 'dosen',
            'nip' => '12345732674',
        ]);

        $dosen = Dosen::create([
            'nip' => '12345732674',
            'nama' => $user->name,
            'kode_prodi' => 'AKT',
            'jabatan' => 'Lektor',
            'status' => 'aktif',
        ]);

        // Create three schedules:
        // 1. Scheduled for today (should be included)
        $todaySchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d'),
            'sesi' => 'Sesi 1',
            'jam_mulai' => '08:30:00',
            'jam_selesai' => '10:00:00',
            'ruang' => 'RA-001',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'terjadwal',
        ]);

        // 2. Scheduled for a future date but status is 'berlangsung' (should be included)
        $ongoingFutureSchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d', strtotime('+10 days')),
            'sesi' => 'Sesi 2',
            'jam_mulai' => '10:30:00',
            'jam_selesai' => '12:00:00',
            'ruang' => 'RA-002',
            'kelas' => 'B',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'berlangsung',
        ]);

        // 3. Scheduled for a future date and status is 'terjadwal' (should NOT be included)
        $scheduledFutureSchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d', strtotime('+10 days')),
            'sesi' => 'Sesi 3',
            'jam_mulai' => '13:00:00',
            'jam_selesai' => '14:30:00',
            'ruang' => 'RA-003',
            'kelas' => 'C',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'terjadwal',
        ]);

        // Act as Dosen and hit dashboard
        $response = $this->actingAs($user)->get(route('dosen.dashboard'));

        $response->assertOk();

        // Get props passed to Inertia render
        $props = $response->original->getData()['page']['props'];

        $todaySchedules = $props['todaySchedules'];
        
        $this->assertCount(2, $todaySchedules);
        
        $ids = collect($todaySchedules)->pluck('id');
        $this->assertTrue($ids->contains($todaySchedule->id));
        $this->assertTrue($ids->contains($ongoingFutureSchedule->id));
        $this->assertFalse($ids->contains($scheduledFutureSchedule->id));
    }

    public function test_admin_dashboard_displays_ongoing_schedules(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        // Setup a dummy Dosen profile for foreign key
        $dosen = Dosen::create([
            'nip' => '123456789',
            'nama' => 'Dummy Lecturer',
            'kode_prodi' => 'AKT',
            'jabatan' => 'Asisten Ahli',
            'status' => 'aktif',
        ]);

        // Create three schedules:
        // 1. Scheduled for today
        $todaySchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d'),
            'sesi' => 'Sesi 1',
            'jam_mulai' => '08:30:00',
            'jam_selesai' => '10:00:00',
            'ruang' => 'RA-001',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'terjadwal',
        ]);

        // 2. Scheduled for a future date but status is 'berlangsung'
        $ongoingFutureSchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d', strtotime('+10 days')),
            'sesi' => 'Sesi 2',
            'jam_mulai' => '10:30:00',
            'jam_selesai' => '12:00:00',
            'ruang' => 'RA-002',
            'kelas' => 'B',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'berlangsung',
        ]);

        // 3. Scheduled for a future date and status is 'terjadwal'
        $scheduledFutureSchedule = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => $dosen->nip,
            'tanggal' => date('Y-m-d', strtotime('+10 days')),
            'sesi' => 'Sesi 3',
            'jam_mulai' => '13:00:00',
            'jam_selesai' => '14:30:00',
            'ruang' => 'RA-003',
            'kelas' => 'C',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2026/2027',
            'status' => 'terjadwal',
        ]);

        // Act as Admin
        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();

        // Get props passed to Inertia render
        $props = $response->original->getData()['page']['props'];

        $this->assertEquals(2, $props['stats']['total_today']);
        $this->assertEquals($todaySchedule->id, $props['activeToday']['id']); // RA-001 ordered by jam_mulai asc
    }

    public function test_admin_can_crud_mahasiswa_with_kelas(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        // 1. Create Mahasiswa (Store)
        $response = $this->actingAs($admin)->post(route('admin.users.storeMahasiswa'), [
            'nim' => '223439999',
            'nama' => 'Test Student',
            'kode_prodi' => 'AKT',
            'angkatan' => '2025',
            'kelas' => 'MI-A',
            'email' => 'teststudent@umi.ac.id',
            'password' => 'password123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mahasiswas', [
            'nim' => '223439999',
            'nama' => 'Test Student',
            'kelas' => 'MI-A',
            'email' => 'teststudent@umi.ac.id',
        ]);

        // 2. Update Mahasiswa
        $response = $this->actingAs($admin)->put(route('admin.users.updateMahasiswa', ['nim' => '223439999']), [
            'nama' => 'Test Student Updated',
            'kode_prodi' => 'AKT',
            'angkatan' => '2025',
            'kelas' => 'MI-B',
            'status' => 'aktif',
            'email' => 'teststudent_updated@umi.ac.id',
            'password' => 'newpassword123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mahasiswas', [
            'nim' => '223439999',
            'nama' => 'Test Student Updated',
            'kelas' => 'MI-B',
            'email' => 'teststudent_updated@umi.ac.id',
        ]);
    }
}
