<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Kontrol akses: registrasi mandiri ditutup dan akun nonaktif ditolak.
 */
class AksesAkunTest extends TestCase
{
    use RefreshDatabase;

    public function test_registrasi_mandiri_tidak_tersedia(): void
    {
        $this->assertFalse(Route::has('register'));

        $this->get('/register')->assertNotFound();

        $this->post('/register', [
            'name' => 'Penyusup',
            'email' => 'penyusup@example.com',
            'password' => 'RahasiaSekali123',
            'password_confirmation' => 'RahasiaSekali123',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['email' => 'penyusup@example.com']);
    }

    public function test_akun_nonaktif_tidak_dapat_login(): void
    {
        $user = User::factory()->nonaktif()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_akun_aktif_dapat_login(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_sesi_berjalan_milik_akun_nonaktif_ditolak_middleware(): void
    {
        // Akun dinonaktifkan setelah pengguna sudah login.
        $admin = User::factory()->admin()->nonaktif()->create();

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertStatus(403);
    }

    public function test_dosen_tidak_dapat_mengakses_area_admin(): void
    {
        $dosen = User::factory()->create();

        $this->actingAs($dosen)->get(route('admin.dashboard'))->assertStatus(403);
        $this->actingAs($dosen)->get(route('admin.jadwal'))->assertStatus(403);
        $this->actingAs($dosen)->get(route('admin.laporan'))->assertStatus(403);
    }

    public function test_admin_tidak_dapat_menghapus_akun_sendiri(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->delete(route('admin.pengaturan.staff.delete', ['id' => $admin->id]))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }
}
