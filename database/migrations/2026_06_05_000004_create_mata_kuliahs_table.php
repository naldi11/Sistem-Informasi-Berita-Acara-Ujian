<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mata_kuliahs', function (Blueprint $table) {
            $table->string('kode_mk')->primary();
            $table->string('nama_mk');
            $table->integer('sks');
            $table->string('kode_prodi')->nullable();
            $table->integer('semester');
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->foreign('kode_prodi')->references('kode_prodi')->on('program_studis')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mata_kuliahs');
    }
};
