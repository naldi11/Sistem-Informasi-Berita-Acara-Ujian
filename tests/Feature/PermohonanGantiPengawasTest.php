<?php

namespace Tests\Feature;

use App\Models\Dosen;
use App\Models\JadwalUjian;
use App\Models\MataKuliah;
use App\Models\PermohonanGantiPengawas;
use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pengajuan penggantian pengawas kini dilakukan dari baris jadwal pada halaman
 * Jadwal Mengawas, sehingga jadwalnya ikut dari URL dan tidak dipilih ulang
 * oleh dosen di dalam formulir.
 */
class PermohonanGantiPengawasTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosenUser;
    protected JadwalUjian $jadwal;

    protected function setUp(): void
    {
        parent::setUp();

        ProgramStudi::create(['kode_prodi' => 'AKT', 'nama_prodi' => 'Akuntansi', 'status' => 'aktif']);

        MataKuliah::create([
            'kode_mk' => 'MK-001',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
            'semester' => 1,
            'status' => 'aktif',
        ]);

        Dosen::create([
            'nip' => '19850312001',
            'nama' => 'Dr. A',
            'kode_prodi' => 'AKT',
            'jabatan' => 'Lektor',
            'status' => 'aktif',
        ]);

        $this->dosenUser = User::factory()->create(['role' => 'dosen', 'nip' => '19850312001']);

        $this->jadwal = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => '19850312001',
            'tanggal' => date('Y-m-d', strtotime('+3 days')),
            'jam_mulai' => '08:30:00',
            'jam_selesai' => '10:00:00',
            'ruang' => 'R.301',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
            'status' => 'terjadwal',
        ]);
    }

    private function ajukan(array $data = [], ?int $jadwalId = null)
    {
        return $this->actingAs($this->dosenUser)->post(
            route('dosen.jadwal.permohonan-penggantian', ['jadwal' => $jadwalId ?? $this->jadwal->id]),
            $data + ['alasan' => 'Sedang menghadiri seminar nasional di luar kota.']
        );
    }

    public function test_menu_ganti_pengawas_yang_lama_sudah_tidak_ada(): void
    {
        $this->assertFalse(\Illuminate\Support\Facades\Route::has('dosen.delegasi'));
        $this->assertFalse(\Illuminate\Support\Facades\Route::has('dosen.permohonan-penggantian'));
    }

    public function test_dosen_dapat_mengajukan_pengganti_dari_baris_jadwal(): void
    {
        $this->ajukan()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('permohonan_ganti_pengawas', [
            'jadwal_ujian_id' => $this->jadwal->id,
            'dosen_pemohon_nip' => '19850312001',
            'status' => 'pending',
        ]);
    }

    public function test_pengawas_jadwal_belum_berubah_sebelum_admin_menyetujui(): void
    {
        $this->ajukan();

        $this->assertSame('19850312001', $this->jadwal->fresh()->nip_dosen);
    }

    public function test_tidak_dapat_mengajukan_dua_kali_untuk_jadwal_yang_sama(): void
    {
        $this->ajukan()->assertSessionHasNoErrors();
        $this->ajukan()->assertSessionHasErrors('alasan');

        $this->assertSame(1, PermohonanGantiPengawas::count());
    }

    public function test_jadwal_yang_sudah_selesai_tidak_dapat_diajukan(): void
    {
        $this->jadwal->update(['status' => 'selesai']);

        $this->ajukan()->assertSessionHasErrors('alasan');

        $this->assertSame(0, PermohonanGantiPengawas::count());
    }

    public function test_alasan_terlalu_pendek_ditolak(): void
    {
        $this->ajukan(['alasan' => 'sakit'])->assertSessionHasErrors('alasan');

        $this->assertSame(0, PermohonanGantiPengawas::count());
    }

    public function test_tidak_dapat_mengajukan_untuk_jadwal_dosen_lain(): void
    {
        Dosen::create([
            'nip' => '19850312002',
            'nama' => 'Dr. B',
            'kode_prodi' => 'AKT',
            'jabatan' => 'Lektor',
            'status' => 'aktif',
        ]);

        $jadwalOrangLain = JadwalUjian::create([
            'kode_mk' => 'MK-001',
            'nip_dosen' => '19850312002',
            'tanggal' => date('Y-m-d', strtotime('+4 days')),
            'jam_mulai' => '08:30:00',
            'jam_selesai' => '10:00:00',
            'ruang' => 'R.302',
            'kelas' => 'B',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
            'status' => 'terjadwal',
        ]);

        $this->ajukan(jadwalId: $jadwalOrangLain->id)->assertStatus(404);

        $this->assertSame(0, PermohonanGantiPengawas::count());
    }

    public function test_halaman_jadwal_membawa_status_permohonan_terakhir(): void
    {
        $this->ajukan();

        $this->actingAs($this->dosenUser)
            ->get(route('dosen.jadwal'))
            ->assertOk()
            ->assertSee('permohonan_ganti_terakhir');
    }
}
