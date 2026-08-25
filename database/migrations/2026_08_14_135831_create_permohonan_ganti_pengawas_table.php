<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permohonan_ganti_pengawas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_ujian_id')->constrained('jadwal_ujians')->onDelete('cascade');
            $table->string('dosen_pemohon_nip', 20);
            $table->foreign('dosen_pemohon_nip')->references('nip')->on('dosens')->onDelete('cascade');
            $table->text('alasan');
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->string('dosen_pengganti_nip', 20)->nullable();
            $table->foreign('dosen_pengganti_nip')->references('nip')->on('dosens')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permohonan_ganti_pengawas');
    }
};
