<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Buang peserta ganda (sisakan baris tertua) sebelum unique index dipasang.
        $duplicates = DB::table('peserta_ujians')
            ->select('jadwal_ujian_id', 'nim', DB::raw('MIN(id) as keep_id'))
            ->groupBy('jadwal_ujian_id', 'nim')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('peserta_ujians')
                ->where('jadwal_ujian_id', $dup->jadwal_ujian_id)
                ->where('nim', $dup->nim)
                ->where('id', '!=', $dup->keep_id)
                ->delete();
        }

        Schema::table('peserta_ujians', function (Blueprint $table) {
            $table->unique(['jadwal_ujian_id', 'nim'], 'peserta_ujians_jadwal_nim_unique');
        });

        // Satu NIP hanya boleh dimiliki satu akun. Kolom nullable, jadi akun
        // admin tanpa NIP tetap boleh lebih dari satu.
        //
        // Import lama dapat menghasilkan beberapa akun dengan NIP sama. Akun
        // tertua dipertahankan; NIP pada duplikatnya dikosongkan agar migrasi
        // tidak gagal, dan akunnya dilaporkan supaya bisa dirapikan manual.
        $nipGanda = DB::table('users')
            ->select('nip', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('nip')
            ->groupBy('nip')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($nipGanda as $dup) {
            $terdampak = DB::table('users')
                ->where('nip', $dup->nip)
                ->where('id', '!=', $dup->keep_id)
                ->pluck('email')
                ->implode(', ');

            DB::table('users')
                ->where('nip', $dup->nip)
                ->where('id', '!=', $dup->keep_id)
                ->update(['nip' => null]);

            logger()->warning("Migrasi: NIP ganda {$dup->nip} dikosongkan pada akun: {$terdampak}");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique('nip', 'users_nip_unique');
        });

        // Index pendukung deteksi bentrok jadwal (ruang & pengawas per tanggal).
        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->index(['tanggal', 'ruang'], 'jadwal_ujians_tanggal_ruang_index');
            $table->index(['tanggal', 'nip_dosen'], 'jadwal_ujians_tanggal_dosen_index');
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_ujians', function (Blueprint $table) {
            $table->dropIndex('jadwal_ujians_tanggal_ruang_index');
            $table->dropIndex('jadwal_ujians_tanggal_dosen_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_nip_unique');
        });

        Schema::table('peserta_ujians', function (Blueprint $table) {
            $table->dropUnique('peserta_ujians_jadwal_nim_unique');
        });
    }
};
