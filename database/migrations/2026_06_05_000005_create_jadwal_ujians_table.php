<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_ujians', function (Blueprint $table) {
            $table->id();
            $table->string('kode_mk');
            $table->string('nip_dosen');
            $table->date('tanggal');
            $table->string('sesi')->nullable();
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->string('ruang');
            $table->string('kelas');
            $table->enum('jenis_ujian', ['UTS', 'UAS']);
            $table->string('semester_aktif'); // Ganjil / Genap
            $table->string('tahun_akademik'); // e.g. 2025/2026
            $table->enum('status', ['terjadwal', 'berlangsung', 'selesai', 'dibatalkan'])->default('terjadwal');
            $table->timestamps();

            $table->foreign('kode_mk')->references('kode_mk')->on('mata_kuliahs')->onDelete('cascade');
            $table->foreign('nip_dosen')->references('nip')->on('dosens')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_ujians');
    }
};
