<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mata_kuliahs', function (Blueprint $table) {
            $table->dropColumn(['teori', 'praktek']);
        });

        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->string('tipe_ujian')->default('Teori')->after('jenis_ujian');
        });
    }

    public function down(): void
    {
        Schema::table('mata_kuliahs', function (Blueprint $table) {
            $table->boolean('teori')->default(true)->after('semester');
            $table->boolean('praktek')->default(false)->after('teori');
        });

        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->dropColumn('tipe_ujian');
        });
    }
};
