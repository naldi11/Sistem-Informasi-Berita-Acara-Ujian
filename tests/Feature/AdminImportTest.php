<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_imports(): void
    {
        $this->post(route('admin.users.importDosen'))->assertRedirect(route('login'));
        $this->post(route('admin.users.importMahasiswa'))->assertRedirect(route('login'));
        $this->post(route('admin.matakuliah.import'))->assertRedirect(route('login'));
        $this->post(route('admin.jadwal.import'))->assertRedirect(route('login'));
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

        $this->actingAs($dosen)
            ->post(route('admin.jadwal.import'))
            ->assertStatus(403);
    }

    public function test_admin_import_validation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

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
        $admin = User::factory()->create(['role' => 'admin']);

        // Upload fake excel file that is actually just binary garbage
        $fakeExcel = UploadedFile::fake()->create('invalid.xlsx', 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $response = $this->actingAs($admin)
            ->post(route('admin.users.importDosen'), ['excel_file' => $fakeExcel]);

        $response->assertSessionHas('error');
    }

    public function test_admin_can_download_templates(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

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
            ->assertStatus(404);
    }

    public function test_dosen_profile_self_healing(): void
    {
        // Create parent ProgramStudi first to avoid FK constraint violation in test db
        \App\Models\ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);

        // Create a user with role 'dosen' and NIP but NO Dosen profile
        $user = User::factory()->create([
            'role' => 'dosen',
            'nip' => '999888777',
        ]);

        $this->assertDatabaseMissing('dosens', ['nip' => '999888777']);

        // Act as the user and visit dashboard
        $response = $this->actingAs($user)->get(route('dosen.dashboard'));

        $response->assertOk();

        // Verify the Dosen profile was automatically created
        $this->assertDatabaseHas('dosens', [
            'nip' => '999888777',
            'nama' => $user->name,
            'kode_prodi' => 'AKT',
            'status' => 'aktif',
        ]);
    }

    private function createExcelFile(array $headers, array $data): UploadedFile
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        foreach ($headers as $colIdx => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . '1', $header);
        }
        
        foreach ($data as $rowIdx => $row) {
            foreach ($row as $colIdx => $val) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue($colLetter . ($rowIdx + 2), $val);
            }
        }
        
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($tempFile);
        
        return new UploadedFile($tempFile, 'test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }


    public function test_admin_can_import_dosen(): void
    {
        \App\Models\ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $headers = ['NIDN', 'Nama Dosen', 'Jabatan Akademik', 'Email (Opsional)', 'Mata Kuliah Diampu (Kode MK, pisah koma)', 'Kelas Diampu (pisah koma)'];
        $data = [
            ['19850312001', 'Dr. John Doe, M.Si.', 'Lektor', 'johndoe@umi.ac.id', 'MAK101,MAK102', 'A,B']
        ];

        $excelFile = $this->createExcelFile($headers, $data);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.importDosen'), ['excel_file' => $excelFile]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        
        $this->assertDatabaseHas('dosens', [
            'nip' => '19850312001',
            'nama' => 'Dr. John Doe, M.Si.',
            'kode_prodi' => null,
        ]);
        
        $this->assertDatabaseHas('users', [
            'nip' => '19850312001',
            'role' => 'dosen',
            'email' => 'johndoe@umi.ac.id',
        ]);
    }

    public function test_admin_can_import_mahasiswa(): void
    {
        \App\Models\ProgramStudi::create([
            'kode_prodi' => 'MNJ',
            'nama_prodi' => 'Manajemen',
            'status' => 'aktif',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $headers = ['NIM / NPM', 'Nama Mahasiswa', 'Kode Prodi', 'Angkatan', 'Kelas'];
        $data = [
            ['2101010001', 'Jane Smith', 'MNJ', '2024', 'A']
        ];

        $excelFile = $this->createExcelFile($headers, $data);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.importMahasiswa'), ['excel_file' => $excelFile]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        
        $this->assertDatabaseHas('mahasiswas', [
            'nim' => '2101010001',
            'nama' => 'Jane Smith',
            'kode_prodi' => 'MNJ',
            'kelas' => 'A',
        ]);
    }

    public function test_admin_can_import_matakuliah(): void
    {
        \App\Models\ProgramStudi::create([
            'kode_prodi' => 'AKT',
            'nama_prodi' => 'Akuntansi',
            'status' => 'aktif',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $headers = ['Kode MK', 'Nama Mata Kuliah', 'Jumlah SKS', 'Kode Prodi', 'Semester'];
        $data = [
            ['MAK101', 'Pengantar Akuntansi', '3', 'AKT', '1']
        ];

        $excelFile = $this->createExcelFile($headers, $data);

        $response = $this->actingAs($admin)
            ->post(route('admin.matakuliah.import'), ['excel_file' => $excelFile]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        
        $this->assertDatabaseHas('mata_kuliahs', [
            'kode_mk' => 'MAK101',
            'nama_mk' => 'Pengantar Akuntansi',
            'sks' => 3,
            'kode_prodi' => 'AKT',
        ]);
    }


}

