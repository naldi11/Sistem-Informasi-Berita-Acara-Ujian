<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->string('email')->nullable()->unique()->after('nama');
            $table->string('password')->nullable()->after('email');
        });

        // Set default password to 'password' for all existing students
        $defaultPassword = Hash::make('password');
        DB::table('mahasiswas')->update([
            'password' => $defaultPassword,
        ]);
    }

    public function down(): void
    {
        Schema::table('mahasiswas', function (Blueprint $table) {
            $table->dropColumn(['email', 'password']);
        });
    }
};
