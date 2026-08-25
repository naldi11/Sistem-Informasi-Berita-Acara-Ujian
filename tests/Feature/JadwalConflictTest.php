<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalUjian;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\PesertaUjian;
use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Deteksi bentrok jadwal ujian: ruang, pengawas, dan peserta.
 */
class JadwalConflictTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();

        ProgramStudi::create(['kode_prodi' => 'AKT', 'nama_prodi' => 'Akuntansi', 'status' => 'aktif']);

        foreach ([['MAK101', 'Pengantar Akuntansi'], ['MAK102', 'Statistika']] as [$kode, $nama]) {
            MataKuliah::create([
                'kode_mk' => $kode, 'nama_mk' => $nama, 'sks' => 3, 'kode_prodi' => 'AKT',
                'semester' => 1, 'teori' => true, 'praktek' => true, 'status' => 'aktif',
            ]);
        }

        foreach ([['19850312001', 'Dr. A'], ['19850312002', 'Dr. B']] as [$nip, $nama]) {
            Dosen::create(['nip' => $nip, 'nama' => $nama, 'kode_prodi' => 'AKT', 'status' => 'aktif']);
        }

        foreach (['2101010001', '2101010002'] as $nim) {
            Mahasiswa::create([
                'nim' => $nim, 'nama' => "Mhs {$nim}", 'kode_prodi' => 'AKT',
                'angkatan' => '2024', 'kelas' => 'A', 'status' => 'aktif',
            ]);
        }
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => '2026-06-08',
            'jam_mulai' => '08:30',
            'jam_selesai' => '10:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
            'student_nims' => ['2101010001'],
        ], $override);
    }

    private function buatJadwalPertama(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload())
            ->assertSessionHasNoErrors();
    }

    public function test_ruang_yang_sama_pada_waktu_beririsan_ditolak(): void
    {
        $this->buatJadwalPertama();

        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'kode_mk' => 'MAK102',
                'nip_dosen' => '19850312002',
                'kelas' => 'B',
                'jam_mulai' => '09:00', // beririsan dengan 08:30-10:00
                'jam_selesai' => '10:30',
                'student_nims' => ['2101010002'],
            ]))
            ->assertSessionHasErrors('ruang');

        $this->assertSame(1, JadwalUjian::count());
    }

    public function test_pengawas_yang_sama_pada_waktu_beririsan_ditolak(): void
    {
        $this->buatJadwalPertama();

        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'kode_mk' => 'MAK102',
                'ruang' => 'R.302',
                'kelas' => 'B',
                'student_nims' => ['2101010002'],
            ]))
            ->assertSessionHasErrors('nip_dosen');
    }

    public function test_mahasiswa_tidak_boleh_ikut_dua_ujian_pada_waktu_yang_sama(): void
    {
        $this->buatJadwalPertama();

        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'kode_mk' => 'MAK102',
                'nip_dosen' => '19850312002',
                'ruang' => 'R.302',
                'kelas' => 'B',
                'student_nims' => ['2101010001'], // sudah ikut ujian jam 08:30
            ]))
            ->assertSessionHasErrors('student_nims');
    }

    public function test_jadwal_berurutan_tanpa_irisan_diterima(): void
    {
        $this->buatJadwalPertama();

        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'kode_mk' => 'MAK102',
                'jam_mulai' => '10:00', // tepat setelah jadwal pertama selesai
                'jam_selesai' => '11:30',
                'kelas' => 'B',
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame(2, JadwalUjian::count());
    }

    public function test_jadwal_dibatalkan_tidak_dihitung_sebagai_bentrok(): void
    {
        $this->buatJadwalPertama();
        JadwalUjian::first()->update(['status' => 'dibatalkan']);

        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload(['kode_mk' => 'MAK102', 'kelas' => 'B']))
            ->assertSessionHasNoErrors();
    }

    public function test_edit_jadwal_tidak_bentrok_dengan_dirinya_sendiri(): void
    {
        $this->buatJadwalPertama();
        $jadwal = JadwalUjian::first();

        $this->actingAs($this->admin)
            ->put(route('admin.jadwal.update', ['id' => $jadwal->id]), $this->payload([
                'ruang' => 'R.301',
                'status' => 'terjadwal',
            ]))
            ->assertSessionHasNoErrors();
    }

    public function test_jam_selesai_harus_setelah_jam_mulai(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'jam_mulai' => '10:00',
                'jam_selesai' => '08:30',
            ]))
            ->assertSessionHasErrors('jam_selesai');
    }

    public function test_peserta_ganda_dalam_satu_pengiriman_ditolak(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.jadwal.store'), $this->payload([
                'student_nims' => ['2101010001', '2101010001'],
            ]))
            ->assertSessionHasErrors();

        $this->assertSame(0, PesertaUjian::count());
    }
}
