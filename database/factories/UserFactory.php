<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            // role & status disetel eksplisit: nilai default kolom tidak terisi
            // pada instance model hasil create(), sehingga Auth::user()->status
            // akan null dan pemeriksaan akun aktif gagal.
            'role' => 'dosen',
            'status' => 'aktif',
            'remember_token' => Str::random(10),
        ];
    }

    /** Akun administrator fakultas. */
    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    /** Akun yang sudah dinonaktifkan. */
    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => 'nonaktif']);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
