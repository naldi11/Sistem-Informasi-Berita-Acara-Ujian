<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Dosen;
use App\Models\MataKuliah;
use App\Models\ProgramStudi;
use App\Models\Mahasiswa;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MahasiswaAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $prodi;
    protected $dosen;
    protected $mahasiswa;
    protected $course;
    protected $schedule;

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

        $this->mahasiswa = Mahasiswa::create([
            'nim' => '2101010001',
            'nama' => 'Jane Smith',
            'email' => 'janesmith@student.umi.ac.id',
            'password' => bcrypt('password'),
            'kode_prodi' => 'AKT',
            'angkatan' => '2024',
            'kelas' => 'A',
            'status' => 'aktif',
        ]);

        $this->course = MataKuliah::create([
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        // Create schedule active today
        $this->schedule = JadwalUjian::create([
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d'),
            'jam_mulai' => date('H:i:s', strtotime('-10 minutes')),
            'jam_selesai' => date('H:i:s', strtotime('+50 minutes')),
            'ruang' => 'Lab 3',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil 2025/2026',
            'tahun_akademik' => '2025/2026',
            'status' => 'terjadwal',
            'token' => 'SECRET',
        ]);

        PesertaUjian::create([
            'jadwal_ujian_id' => $this->schedule->id,
            'nim' => '2101010001',
            'kehadiran' => 'belum_ditentukan',
        ]);
    }

    public function test_student_can_login_to_portal(): void
    {
        $response = $this->post(route('mahasiswa.login.submit'), [
            'nim' => '2101010001',
            'password' => 'password',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('mahasiswa.dashboard'));
        $this->assertEquals('2101010001', session('mahasiswa_nim'));
    }

    public function test_student_cannot_login_with_wrong_password(): void
    {
        $response = $this->post(route('mahasiswa.login.submit'), [
            'nim' => '2101010001',
            'password' => 'wrong_password',
        ]);

        $response->assertSessionHasErrors(['password']);
        $this->assertNull(session('mahasiswa_nim'));
    }

    public function test_attendance_fails_with_invalid_token(): void
    {
        Setting::setValue('attendance_token_enabled', true);
        Setting::setValue('attendance_gps_enabled', false);
        Setting::setValue('attendance_ip_enabled', false);

        $response = $this->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'token' => 'WRONG_TOKEN',
            'signature' => 'data:image/png;base64,drawing_data_url',
        ]);

        $response->assertSessionHasErrors(['token']);
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'belum_ditentukan'
        ]);
    }

    public function test_attendance_succeeds_with_correct_token_only(): void
    {
        Setting::setValue('attendance_token_enabled', true);
        Setting::setValue('attendance_gps_enabled', false);
        Setting::setValue('attendance_ip_enabled', false);

        $response = $this->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'token' => 'SECRET',
            'signature' => 'data:image/png;base64,drawing_data_url',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'hadir',
            'tanda_tangan' => 'data:image/png;base64,drawing_data_url'
        ]);
    }

    public function test_attendance_fails_when_outside_gps_geofence(): void
    {
        Setting::setValue('attendance_token_enabled', false);
        Setting::setValue('attendance_gps_enabled', true);
        Setting::setValue('attendance_ip_enabled', false);
        Setting::setValue('campus_latitude', -5.1476);
        Setting::setValue('campus_longitude', 119.4328);
        Setting::setValue('campus_radius', 100); // 100m radius

        // Coordinates far away (e.g. Jakarta, approx 1400km away from Makassar UMI)
        $response = $this->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'signature' => 'data:image/png;base64,drawing_data_url',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
        ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'belum_ditentukan'
        ]);
    }

    public function test_attendance_succeeds_when_within_gps_geofence(): void
    {
        Setting::setValue('attendance_token_enabled', false);
        Setting::setValue('attendance_gps_enabled', true);
        Setting::setValue('attendance_ip_enabled', false);
        Setting::setValue('campus_latitude', -5.1476);
        Setting::setValue('campus_longitude', 119.4328);
        Setting::setValue('campus_radius', 100);

        // Coordinates close by (e.g., -5.1475, 119.4329 is within ~20m)
        $response = $this->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'signature' => 'data:image/png;base64,drawing_data_url',
            'latitude' => -5.1475,
            'longitude' => 119.4329,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'hadir'
        ]);
    }

    public function test_attendance_fails_when_ip_is_not_whitelisted(): void
    {
        Setting::setValue('attendance_token_enabled', false);
        Setting::setValue('attendance_gps_enabled', false);
        Setting::setValue('attendance_ip_enabled', true);
        Setting::setValue('campus_ip_whitelist', '192.168.5.5, 192.168.10.0/24');

        $response = $this->withServerVariables(['REMOTE_ADDR' => '202.158.3.3'])->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'signature' => 'data:image/png;base64,drawing_data_url',
        ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'belum_ditentukan'
        ]);
    }

    public function test_attendance_succeeds_when_ip_is_whitelisted(): void
    {
        Setting::setValue('attendance_token_enabled', false);
        Setting::setValue('attendance_gps_enabled', false);
        Setting::setValue('attendance_ip_enabled', true);
        Setting::setValue('campus_ip_whitelist', '127.0.0.1, 192.168.1.0/24');

        // Whitelisted local subnet
        $response = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.50'])->post(route('mahasiswa.absen.submit'), [
            'nim' => '2101010001',
            'jadwal_ujian_id' => $this->schedule->id,
            'signature' => 'data:image/png;base64,drawing_data_url',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('peserta_ujians', [
            'nim' => '2101010001',
            'kehadiran' => 'hadir'
        ]);
    }
}
