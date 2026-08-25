<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add token to jadwal_ujians
        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->string('token', 10)->nullable()->after('status');
        });

        // Generate tokens for existing exam schedules
        $schedules = DB::table('jadwal_ujians')->get();
        foreach ($schedules as $sched) {
            DB::table('jadwal_ujians')
                ->where('id', $sched->id)
                ->update(['token' => strtoupper(Str::random(6))]);
        }

        // 2. Create settings table
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        $defaults = [
            'attendance_token_enabled' => 'true',
            'attendance_gps_enabled'   => 'false',
            'attendance_ip_enabled'    => 'false',
            'campus_latitude'          => '-5.1476', // Default to UMI Makassar area coordinates
            'campus_longitude'         => '119.4328',
            'campus_radius'            => '100', // Default to 100 meters
            'campus_ip_whitelist'      => '127.0.0.1, 192.168.1.0/24',
        ];

        foreach ($defaults as $key => $val) {
            DB::table('settings')->insert([
                'key'        => $key,
                'value'      => $val,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->dropColumn('token');
        });

        Schema::dropIfExists('settings');
    }
};
