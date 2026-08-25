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
        Schema::table('peserta_ujians', function (Blueprint $table) {
            if (Schema::hasColumn('peserta_ujians', 'token')) {
                $table->dropColumn('token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_ujians', function (Blueprint $table) {
            $table->string('token', 10)->nullable()->after('nim');
        });
    }
};
