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
 * Alur Berita Acara Ujian: pengisian oleh dosen, sinkronisasi peserta oleh
 * admin, dan aturan transisi status validasi.
 */
class BeritaAcaraTest extends TestCase
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

        foreach (['2101010001', '2101010002', '2101010003'] as $nim) {
            Mahasiswa::create([
                'nim' => $nim, 'nama' => "Mhs {$nim}", 'kode_prodi' => 'AKT',
                'angkatan' => '2024', 'kelas' => 'A', 'status' => 'aktif',
            ]);
        }

        $this->jadwal = JadwalUjian::create([
            'kode_mk' => 'MAK101', 'nip_dosen' => '19850312001', 'tanggal' => '2026-06-08',
            'jam_mulai' => '08:30:00', 'jam_selesai' => '10:00:00', 'ruang' => 'R.301',
            'kelas' => 'A', 'jenis_ujian' => 'UTS', 'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026', 'status' => 'terjadwal',
        ]);

        foreach (['2101010001', '2101010002', '2101010003'] as $nim) {
            PesertaUjian::create([
                'jadwal_ujian_id' => $this->jadwal->id,
                'nim' => $nim,
                'kehadiran' => 'belum_ditentukan',
            ]);
        }
    }

    private function payloadBau(array $override = []): array
    {
        return array_merge([
            'jam_mulai_aktual' => '08:35',
            'jam_selesai_aktual' => '10:05',
            'catatan' => 'Ujian berjalan lancar.',
            'status_validasi' => 'menunggu_validasi',
            'attendance' => [
                '2101010001' => 'hadir',
                '2101010002' => 'hadir',
                '2101010003' => 'absen',
            ],
            'nilai' => ['2101010001' => 80],
            'signatures' => ['2101010001' => 'data:image/png;base64,AAA'],
        ], $override);
    }

    private function simpanBau(array $override = [])
    {
        return $this->actingAs($this->dosenUser)->post(
            route('dosen.berita-acara.save', ['jadwal_id' => $this->jadwal->id]),
            $this->payloadBau($override)
        );
    }

    public function test_rekap_hadir_absen_dihitung_dari_basis_data(): void
    {
        $this->simpanBau()->assertSessionHasNoErrors();

        $bau = BeritaAcara::firstOrFail();
        $this->assertSame(2, $bau->jumlah_hadir);
        $this->assertSame(1, $bau->jumlah_absen);
    }

    public function test_nilai_kosong_diterima_sebagai_null(): void
    {
        // Formulir mengirim string kosong untuk mahasiswa yang belum dinilai.
        $this->simpanBau([
            'nilai' => ['2101010001' => '', '2101010002' => 75],
        ])->assertSessionHasNoErrors();

        $this->assertNull(
            PesertaUjian::where('jadwal_ujian_id', $this->jadwal->id)->where('nim', '2101010001')->value('nilai')
        );
        $this->assertEquals(
            75,
            PesertaUjian::where('jadwal_ujian_id', $this->jadwal->id)->where('nim', '2101010002')->value('nilai')
        );
    }

    public function test_nilai_di_luar_rentang_ditolak(): void
    {
        $this->simpanBau(['nilai' => ['2101010001' => 150]])
            ->assertSessionHasErrors('nilai.2101010001');
    }

    public function test_tanda_tangan_yang_sudah_ada_tidak_terhapus_bila_tidak_dikirim(): void
    {
        $this->simpanBau(['status_validasi' => 'draft'])->assertSessionHasNoErrors();

        // Pengiriman berikutnya tanpa kunci signatures sama sekali.
        $this->simpanBau(['status_validasi' => 'draft', 'signatures' => []])
            ->assertSessionHasNoErrors();

        $this->assertSame(
            'data:image/png;base64,AAA',
            PesertaUjian::where('jadwal_ujian_id', $this->jadwal->id)->where('nim', '2101010001')->value('tanda_tangan')
        );
    }

    public function test_nim_bukan_peserta_ditolak(): void
    {
        $this->simpanBau([
            'attendance' => [
                '2101010001' => 'hadir',
                '9999999999' => 'hadir', // bukan peserta ujian ini
            ],
        ])->assertSessionHasErrors('attendance');

        $this->assertSame(0, BeritaAcara::count());
    }

    public function test_menyimpan_draft_tidak_menimpa_status_jadwal(): void
    {
        $this->jadwal->update(['status' => 'dibatalkan']);

        $this->simpanBau(['status_validasi' => 'draft'])->assertSessionHasNoErrors();

        $this->assertSame('dibatalkan', $this->jadwal->fresh()->status);
    }

    public function test_pengajuan_bau_memajukan_status_jadwal(): void
    {
        $this->simpanBau()->assertSessionHasNoErrors();

        $this->assertSame('berlangsung', $this->jadwal->fresh()->status);
    }

    public function test_bau_draft_belum_dapat_divalidasi(): void
    {
        $this->simpanBau(['status_validasi' => 'draft']);
        $bau = BeritaAcara::firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('admin.berita-acara.validate', ['id' => $bau->id]), ['status_validasi' => 'tervalidasi'])
            ->assertSessionHasErrors('status_validasi');

        $this->assertSame('draft', $bau->fresh()->status_validasi);
    }

    public function test_bau_yang_diajukan_dapat_divalidasi_dan_tercatat_validatornya(): void
    {
        $this->simpanBau();
        $bau = BeritaAcara::firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('admin.berita-acara.validate', ['id' => $bau->id]), ['status_validasi' => 'tervalidasi'])
            ->assertSessionHasNoErrors();

        $bau->refresh();
        $this->assertSame('tervalidasi', $bau->status_validasi);
        $this->assertSame($this->admin->id, $bau->divalidasi_oleh);
        $this->assertNotNull($bau->divalidasi_pada);
        $this->assertSame('selesai', $this->jadwal->fresh()->status);
    }

    public function test_bau_tervalidasi_tidak_dapat_diubah_lagi_oleh_dosen(): void
    {
        $this->simpanBau();
        $bau = BeritaAcara::firstOrFail();
        $bau->update(['status_validasi' => 'tervalidasi']);

        $this->simpanBau(['catatan' => 'diubah diam-diam'])->assertSessionHas('error');

        $this->assertSame('Ujian berjalan lancar.', $bau->fresh()->catatan);
    }

    public function test_edit_jadwal_mempertahankan_kehadiran_nilai_dan_tanda_tangan(): void
    {
        $this->simpanBau(['status_validasi' => 'draft'])->assertSessionHasNoErrors();

        // Admin mengganti ruang dan mengeluarkan satu peserta.
        $this->actingAs($this->admin)->put(route('admin.jadwal.update', ['id' => $this->jadwal->id]), [
            'kode_mk' => 'MAK101',
            'nip_dosen' => '19850312001',
            'tanggal' => '2026-06-08',
            'jam_mulai' => '08:30',
            'jam_selesai' => '10:00',
            'ruang' => 'R.302',
            'kelas' => 'A',
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
            'status' => 'berlangsung',
            'student_nims' => ['2101010001', '2101010002'],
        ])->assertSessionHasNoErrors();

        // Dulu seluruh peserta dihapus lalu dibuat ulang, sehingga data ini hilang.
        $peserta = PesertaUjian::where('jadwal_ujian_id', $this->jadwal->id)
            ->where('nim', '2101010001')
            ->firstOrFail();

        $this->assertSame('hadir', $peserta->kehadiran);
        $this->assertEquals(80, $peserta->nilai);
        $this->assertSame('data:image/png;base64,AAA', $peserta->tanda_tangan);

        // Peserta yang dikeluarkan memang hilang, yang tersisa tetap dua.
        $this->assertSame(2, PesertaUjian::where('jadwal_ujian_id', $this->jadwal->id)->count());
    }

    public function test_jadwal_dengan_bau_tervalidasi_tidak_dapat_diubah_atau_dihapus(): void
    {
        $this->simpanBau();
        BeritaAcara::firstOrFail()->update(['status_validasi' => 'tervalidasi']);

        $this->actingAs($this->admin)
            ->put(route('admin.jadwal.update', ['id' => $this->jadwal->id]), [
                'kode_mk' => 'MAK101', 'nip_dosen' => '19850312001', 'tanggal' => '2026-06-09',
                'jam_mulai' => '08:30', 'jam_selesai' => '10:00', 'ruang' => 'R.999',
                'kelas' => 'A', 'jenis_ujian' => 'UTS', 'semester_aktif' => 'Ganjil',
                'tahun_akademik' => '2025/2026', 'status' => 'selesai',
                'student_nims' => ['2101010001'],
            ])
            ->assertSessionHas('error');

        $this->assertSame('R.301', $this->jadwal->fresh()->ruang);

        $this->actingAs($this->admin)
            ->delete(route('admin.jadwal.delete', ['id' => $this->jadwal->id]))
            ->assertSessionHas('error');

        $this->assertNotNull($this->jadwal->fresh());
    }

    public function test_dosen_lain_tidak_dapat_mengisi_bau_milik_orang_lain(): void
    {
        Dosen::create(['nip' => '19850312002', 'nama' => 'Dr. B', 'kode_prodi' => 'AKT', 'status' => 'aktif']);
        $lain = User::factory()->create(['nip' => '19850312002', 'role' => 'dosen']);

        $this->actingAs($lain)
            ->post(route('dosen.berita-acara.save', ['jadwal_id' => $this->jadwal->id]), $this->payloadBau())
            ->assertStatus(404);
    }
}
