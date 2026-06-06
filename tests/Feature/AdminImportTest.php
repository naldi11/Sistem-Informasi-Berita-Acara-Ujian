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
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
}
