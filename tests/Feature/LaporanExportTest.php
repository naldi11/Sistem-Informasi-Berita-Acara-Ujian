<?php

namespace Tests\Feature;

use App\Models\BeritaAcara;
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
 * Ekspor laporan dan ukuran muatan (payload) yang dikirim ke browser.
 */
class LaporanExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $dosenUser;
    protected JadwalUjian $jadwal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();

        ProgramStudi::create(['kode_prodi' => 'AKT', 'nama_prodi' => 'Akuntansi', 'status' => 'aktif']);
        MataKuliah::create([
            'kode_mk' => 'MAK101', 'nama_mk' => 'Pengantar Akuntansi', 'sks' => 3,
            'kode_prodi' => 'AKT', 'semester' => 1, 'teori' => true, 'praktek' => true, 'status' => 'aktif',
        ]);
        Dosen::create(['nip' => '19850312001', 'nama' => 'Dr. A', 'kode_prodi' => 'AKT', 'status' => 'aktif']);
        $this->dosenUser = User::factory()->create(['nip' => '19850312001', 'role' => 'dosen']);
        Mahasiswa::create([
            'nim' => '2101010001', 'nama' => 'Jane', 'kode_prodi' => 'AKT',
            'angkatan' => '2024', 'kelas' => 'A', 'status' => 'aktif',
        ]);

        $this->jadwal = JadwalUjian::create([
            'kode_mk' => 'MAK101', 'nip_dosen' => '19850312001', 'tanggal' => '2026-06-08',
            'jam_mulai' => '08:30:00', 'jam_selesai' => '10:00:00', 'ruang' => 'R.301',
            'kelas' => 'A', 'jenis_ujian' => 'UTS', 'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026', 'status' => 'selesai',
        ]);

        PesertaUjian::create([
            'jadwal_ujian_id' => $this->jadwal->id,
            'nim' => '2101010001',
            'kehadiran' => 'hadir',
            'nilai' => 90,
            // Tanda tangan base64 berukuran besar: tidak boleh ikut terkirim ke
            // halaman yang tidak menampilkannya.
            'tanda_tangan' => 'data:image/png;base64,' . str_repeat('A', 5000),
        ]);

        BeritaAcara::create([
            'jadwal_ujian_id' => $this->jadwal->id,
            'jam_mulai_aktual' => '08:35:00',
            'jam_selesai_aktual' => '10:05:00',
            'jumlah_hadir' => 1,
            'jumlah_absen' => 0,
            'status_validasi' => 'tervalidasi',
        ]);
    }

    public function test_ekspor_excel_memakai_response_laravel_dan_menjaga_sesi(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.laporan.excel'));

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->assertStringContainsString('rekap_laporan_bau.xlsx', $response->headers->get('Content-Disposition'));

        // Isi berkas benar-benar terkirim (dulu ditulis lewat exit; di luar response).
        $this->assertNotEmpty($response->streamedContent());
    }

    public function test_ekspor_pdf_berhasil(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.laporan.pdf'))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_daftar_jadwal_admin_tidak_mengirim_tanda_tangan(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.jadwal'));

        $response->assertOk();
        $this->assertStringNotContainsString('tanda_tangan', $response->getContent());
    }

    public function test_daftar_jadwal_dosen_tidak_mengirim_tanda_tangan(): void
    {
        $response = $this->actingAs($this->dosenUser)->get(route('dosen.jadwal'));

        $response->assertOk();
        $this->assertStringNotContainsString('tanda_tangan', $response->getContent());
    }

    public function test_halaman_input_bau_tetap_mengirim_tanda_tangan(): void
    {
        // Halaman ini memang membutuhkannya untuk menampilkan tanda tangan.
        $this->actingAs($this->dosenUser)
            ->get(route('dosen.berita-acara.input', ['jadwal_id' => $this->jadwal->id]))
            ->assertOk()
            ->assertSee('tanda_tangan');
    }

    public function test_daftar_admin_dipaginasi(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.jadwal'))
            ->assertOk()
            ->assertSee('per_page')
            ->assertSee('last_page');
    }
}
