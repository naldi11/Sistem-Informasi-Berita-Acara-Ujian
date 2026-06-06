<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mahasiswas', function (Blueprint $table) {
            $table->string('nim')->primary();
            $table->string('nama');
            $table->string('kode_prodi')->nullable();
            $table->string('angkatan');
            $table->string('kelas')->nullable();
            $table->enum('status', ['aktif', 'cuti', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->foreign('kode_prodi')->references('kode_prodi')->on('program_studis')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mahasiswas');
    }
};
