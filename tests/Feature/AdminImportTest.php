<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class AdminImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_imports(): void
    {
        $this->post(route('admin.users.importDosen'))->assertRedirect(route('login'));
        $this->post(route('admin.users.importMahasiswa'))->assertRedirect(route('login'));
        $this->post(route('admin.matakuliah.import'))->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_access_imports(): void
    {
        $dosen = User::factory()->create(['role' => 'dosen']);

        $this->actingAs($dosen)
            ->post(route('admin.users.importDosen'))
            ->assertStatus(403);

        $this->actingAs($dosen)
            ->post(route('admin.users.importMahasiswa'))
            ->assertStatus(403);

        $this->actingAs($dosen)
            ->post(route('admin.matakuliah.import'))
            ->assertStatus(403);
    }

    public function test_admin_import_validation(): void
    {
        $admin = User::factory()->admin()->create();

        // Upload no file
        $this->actingAs($admin)
            ->post(route('admin.users.importDosen'))
            ->assertSessionHasErrors('excel_file');

        // Upload wrong type of file
        $txtFile = UploadedFile::fake()->create('document.txt', 10);
        $this->actingAs($admin)
            ->post(route('admin.users.importDosen'), ['excel_file' => $txtFile])
            ->assertSessionHasErrors('excel_file');
    }

    public function test_admin_import_invalid_excel_error(): void
    {
        $admin = User::factory()->admin()->create();

        // Upload fake excel file that is actually just binary garbage
        $fakeExcel = UploadedFile::fake()->create('invalid.xlsx', 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $response = $this->actingAs($admin)
            ->post(route('admin.users.importDosen'), ['excel_file' => $fakeExcel]);

        $response->assertSessionHas('error');
    }

    public function test_admin_can_download_templates(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('admin.templates.download', ['type' => 'dosen']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->actingAs($admin)
            ->get(route('admin.templates.download', ['type' => 'mahasiswa']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->actingAs($admin)
            ->get(route('admin.templates.download', ['type' => 'matakuliah']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->actingAs($admin)
            ->get(route('admin.templates.download', ['type' => 'jadwal']))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_dosen_without_profile_is_rejected_instead_of_being_invented(): void
    {
        // Akun dosen tanpa baris Dosen dulu "disembuhkan" otomatis dengan prodi
        // dan jabatan karangan. Sekarang harus ditolak.
        $user = User::factory()->create([
            'role' => 'dosen',
            'nip' => '999888777',
        ]);

        $this->actingAs($user)
            ->get(route('dosen.dashboard'))
            ->assertStatus(403);

        $this->assertDatabaseMissing('dosens', ['nip' => '999888777']);
    }

    public function test_import_dosen_does_not_reset_existing_password(): void
    {
        config(['sibau.import_default_password' => 'password']);

        $admin = User::factory()->admin()->create();

        \App\Models\ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);
        \App\Models\Dosen::create([
            'nip' => '19850312001',
            'nama' => 'Dr. John Doe',
            'kode_prodi' => 'AKT',
            'status' => 'aktif',
        ]);

        $dosenUser = User::factory()->create([
            'nip' => '19850312001',
            'password' => Hash::make('kata-sandi-pilihan-dosen'),
        ]);
        $hashLama = $dosenUser->password;

        $this->actingAs($admin)->post(route('admin.users.importDosen'), [
            'excel_file' => $this->berkasExcel([
                ['NIP', 'Nama', 'Kode Prodi', 'Jabatan', 'Email', 'MK', 'Kelas'],
                ['19850312001', 'Dr. John Doe', 'AKT', 'Lektor', '', '', 'A'],
            ]),
        ]);

        $this->assertSame($hashLama, $dosenUser->fresh()->password);
        $this->assertFalse(Hash::check('password', $dosenUser->fresh()->password));
        $this->assertTrue(Hash::check('kata-sandi-pilihan-dosen', $dosenUser->fresh()->password));
    }

    public function test_import_dosen_memakai_kata_sandi_bawaan_dari_konfigurasi(): void
    {
        config(['sibau.import_default_password' => 'password']);

        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post(route('admin.users.importDosen'), [
            'excel_file' => $this->berkasExcel([
                ['NIP', 'Nama', 'Kode Prodi', 'Jabatan', 'Email', 'MK', 'Kelas'],
                ['19900101001', 'Dr. Baru', '', '', '', '', ''],
            ]),
        ])->assertSessionHas('success');

        $baru = User::where('nip', '19900101001')->firstOrFail();
        $this->assertTrue(Hash::check('password', $baru->password));
    }

    public function test_kata_sandi_diacak_bila_konfigurasi_dikosongkan(): void
    {
        config(['sibau.import_default_password' => '']);

        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post(route('admin.users.importDosen'), [
            'excel_file' => $this->berkasExcel([
                ['NIP', 'Nama', 'Kode Prodi', 'Jabatan', 'Email', 'MK', 'Kelas'],
                ['19900101002', 'Dr. Acak', '', '', '', '', ''],
            ]),
        ])->assertSessionHas('success');

        $baru = User::where('nip', '19900101002')->firstOrFail();
        $this->assertFalse(Hash::check('password', $baru->password));
        $this->assertFalse(Hash::check('password123', $baru->password));
    }

    public function test_import_jadwal_does_not_attach_random_students(): void
    {
        $admin = User::factory()->admin()->create();

        \App\Models\ProgramStudi::create(['kode_prodi' => 'AKT', 'nama_prodi' => 'Akuntansi', 'status' => 'aktif']);
        foreach (['2101010001', '2101010002', '2101010003'] as $nim) {
            \App\Models\Mahasiswa::create([
                'nim' => $nim, 'nama' => "Mhs {$nim}", 'kode_prodi' => 'AKT',
                'angkatan' => '2024', 'kelas' => 'A', 'status' => 'aktif',
            ]);
        }

        $baris = array_fill(0, 4, ['', '', '', '', '', '', '', '', '']);
        $baris[] = ['Hari/Tanggal', 'Jam', 'Ruang 1', 'Ruang 2', 'Mata Kuliah', 'SKS', 'Kls', 'Jml Mhs', 'Dosen'];
        $baris[] = ['Senin, 08 Juni 2026', '08.30 - 10.00', 'R.301', '', 'Akuntansi Keuangan', '3', 'A', '35', 'Dr. John Doe'];

        $this->actingAs($admin)->post(route('admin.jadwal.import'), [
            'excel_file' => $this->berkasExcel($baris),
            'jenis_ujian' => 'UTS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
        ])->assertSessionHas('success');

        $this->assertDatabaseCount('jadwal_ujians', 1);
        // Dulu baris impor otomatis diisi 20-25 mahasiswa acak.
        $this->assertDatabaseCount('peserta_ujians', 0);
    }

    public function test_import_jadwal_skips_unreadable_rows_instead_of_inventing_data(): void
    {
        $admin = User::factory()->admin()->create();

        $baris = array_fill(0, 4, ['', '', '', '', '', '', '', '', '']);
        $baris[] = ['Hari/Tanggal', 'Jam', 'Ruang 1', 'Ruang 2', 'Mata Kuliah', 'SKS', 'Kls', 'Jml Mhs', 'Dosen'];
        $baris[] = ['tanggal ngawur', 'jam ngawur', 'R.301', '', 'Akuntansi Keuangan', '3', 'A', '35', 'Dr. John Doe'];
        $baris[] = ['Senin, 08 Juni 2026', '08.30 - 10.00', 'R.302', '', 'Statistika', '3', 'B', '30', ''];

        $this->actingAs($admin)->post(route('admin.jadwal.import'), [
            'excel_file' => $this->berkasExcel($baris),
            'jenis_ujian' => 'UAS',
            'semester_aktif' => 'Ganjil',
            'tahun_akademik' => '2025/2026',
        ])->assertSessionHas('error');

        $this->assertDatabaseCount('jadwal_ujians', 0);
        // NIP/kode MK karangan tidak boleh dibuat untuk baris yang gagal dibaca.
        $this->assertDatabaseCount('dosens', 0);
    }

    /** Tulis larik baris menjadi berkas .xlsx sungguhan untuk diunggah. */
    private function berkasExcel(array $rows): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getActiveSheet()->fromArray($rows, null, 'A1');

        $path = tempnam(sys_get_temp_dir(), 'sibau') . '.xlsx';
        (new Xlsx($spreadsheet))->save($path);

        return new UploadedFile($path, 'data.xlsx', null, null, true);
    }
}
