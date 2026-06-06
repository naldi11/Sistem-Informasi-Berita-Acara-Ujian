<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('peserta_ujians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jadwal_ujian_id')->constrained('jadwal_ujians')->onDelete('cascade');
            $table->string('nim');
            $table->enum('kehadiran', ['hadir', 'absen', 'belum_ditentukan'])->default('belum_ditentukan');
            $table->double('nilai')->nullable();
            $table->longText('tanda_tangan')->nullable(); // Base64 signature
            $table->timestamps();

            $table->foreign('nim')->references('nim')->on('mahasiswas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peserta_ujians');
    }
};
