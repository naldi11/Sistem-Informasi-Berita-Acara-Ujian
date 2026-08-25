<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berita_acaras', function (Blueprint $table) {
            $table->foreignId('divalidasi_oleh')->nullable()->after('status_validasi')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('divalidasi_pada')->nullable()->after('divalidasi_oleh');
            $table->timestamp('diajukan_pada')->nullable()->after('divalidasi_pada');
        });
    }

    public function down(): void
    {
        Schema::table('berita_acaras', function (Blueprint $table) {
            $table->dropConstrainedForeignId('divalidasi_oleh');
            $table->dropColumn(['divalidasi_pada', 'diajukan_pada']);
        });
    }
};
