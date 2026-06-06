<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('berita_acaras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_ujian_id')->unique()->constrained('jadwal_ujians')->onDelete('cascade');
            $table->time('jam_mulai_aktual')->nullable();
            $table->time('jam_selesai_aktual')->nullable();
            $table->text('catatan')->nullable();
            $table->integer('jumlah_hadir')->default(0);
            $table->integer('jumlah_absen')->default(0);
            $table->enum('status_validasi', ['draft', 'menunggu_validasi', 'tervalidasi'])->default('draft');
            $table->string('file_pdf')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('berita_acaras');
    }
};
