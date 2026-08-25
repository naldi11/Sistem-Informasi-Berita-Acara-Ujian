<?php

namespace App\Support;

use App\Models\Dosen;
use App\Models\JadwalUjian;
use App\Models\MataKuliah;
use App\Models\PesertaUjian;

/**
 * Aturan penjadwalan ujian: larangan dosen pengampu mengawas kelasnya sendiri,
 * dan deteksi bentrok ruang / pengawas / peserta.
 *
 * Dipakai bersama oleh storeJadwal dan updateJadwal supaya aturannya tidak
 * bercabang di dua tempat.
 */
class JadwalValidator
{
    /**
     * @param  array<string, mixed>  $data     data jadwal yang sudah tervalidasi
     * @param  array<int, string>    $nims     NIM calon peserta
     * @param  int|null              $abaikanId  id jadwal yang sedang diedit
     * @return array<string, string> pesan error per field; kosong bila lolos
     */
    public static function periksa(array $data, array $nims = [], ?int $abaikanId = null): array
    {
        return array_filter([
            'nip_dosen' => self::periksaPengampu($data)
                ?? self::periksaBentrokPengawas($data, $abaikanId),
            'ruang' => self::periksaBentrokRuang($data, $abaikanId),
            'student_nims' => self::periksaBentrokPeserta($data, $nims, $abaikanId),
        ]);
    }

    /**
     * Dosen pengampu teori tidak boleh mengawas ujian kelasnya sendiri.
     * Aturan hanya berlaku untuk mata kuliah teori murni (tanpa praktek).
     */
    private static function periksaPengampu(array $data): ?string
    {
        $course = MataKuliah::find($data['kode_mk']);
        if (!$course || !$course->teori || $course->praktek) {
            return null;
        }

        $dosen = Dosen::find($data['nip_dosen']);
        if (!$dosen) {
            return null;
        }

        $ampuMK = is_array($dosen->ampu_mata_kuliah) ? $dosen->ampu_mata_kuliah : [];
        $ampuKelas = is_array($dosen->ampu_kelas) ? $dosen->ampu_kelas : [];

        if (!in_array($data['kode_mk'], $ampuMK, true)) {
            return null;
        }

        foreach ($ampuKelas as $kelas) {
            if (strcasecmp(trim((string) $kelas), trim((string) $data['kelas'])) === 0) {
                return "Dosen {$dosen->nama} adalah Dosen Pengampu Teori untuk mata kuliah "
                    . "{$course->nama_mk} di kelas {$data['kelas']} dan tidak dapat dipilih "
                    . 'sebagai pengawas ujian.';
            }
        }

        return null;
    }

    /** Pengawas tidak boleh ditugaskan di dua ujian yang waktunya beririsan. */
    private static function periksaBentrokPengawas(array $data, ?int $abaikanId): ?string
    {
        $bentrok = self::queryBeririsan($data, $abaikanId)
            ->where('nip_dosen', $data['nip_dosen'])
            ->with('mataKuliah')
            ->first();

        if (!$bentrok) {
            return null;
        }

        return sprintf(
            'Dosen ini sudah ditugaskan mengawas %s kelas %s pada %s (%s-%s) di ruang %s.',
            $bentrok->mataKuliah?->nama_mk ?? $bentrok->kode_mk,
            $bentrok->kelas,
            $bentrok->tanggal,
            substr((string) $bentrok->jam_mulai, 0, 5),
            substr((string) $bentrok->jam_selesai, 0, 5),
            $bentrok->ruang
        );
    }

    /** Satu ruang tidak boleh dipakai dua ujian pada waktu yang beririsan. */
    private static function periksaBentrokRuang(array $data, ?int $abaikanId): ?string
    {
        $bentrok = self::queryBeririsan($data, $abaikanId)
            ->where('ruang', $data['ruang'])
            ->with('mataKuliah')
            ->first();

        if (!$bentrok) {
            return null;
        }

        return sprintf(
            'Ruang %s sudah dipakai ujian %s kelas %s pada %s (%s-%s).',
            $data['ruang'],
            $bentrok->mataKuliah?->nama_mk ?? $bentrok->kode_mk,
            $bentrok->kelas,
            $bentrok->tanggal,
            substr((string) $bentrok->jam_mulai, 0, 5),
            substr((string) $bentrok->jam_selesai, 0, 5)
        );
    }

    /** Seorang mahasiswa tidak boleh terdaftar di dua ujian pada waktu yang beririsan. */
    private static function periksaBentrokPeserta(array $data, array $nims, ?int $abaikanId): ?string
    {
        if ($nims === []) {
            return null;
        }

        $idBeririsan = self::queryBeririsan($data, $abaikanId)->pluck('id');
        if ($idBeririsan->isEmpty()) {
            return null;
        }

        $bentrok = PesertaUjian::whereIn('jadwal_ujian_id', $idBeririsan)
            ->whereIn('nim', $nims)
            ->with('mahasiswa')
            ->limit(5)
            ->get();

        if ($bentrok->isEmpty()) {
            return null;
        }

        $nama = $bentrok->map(fn ($p) => $p->mahasiswa?->nama ?? $p->nim)->unique()->implode(', ');

        return "Mahasiswa berikut sudah terdaftar pada ujian lain di waktu yang sama: {$nama}.";
    }

    /**
     * Jadwal lain pada tanggal yang sama yang rentang jamnya beririsan.
     * Jadwal berstatus 'dibatalkan' diabaikan.
     */
    private static function queryBeririsan(array $data, ?int $abaikanId)
    {
        return JadwalUjian::query()
            ->where('tanggal', $data['tanggal'])
            ->where('status', '!=', 'dibatalkan')
            ->when($abaikanId, fn ($q) => $q->where('id', '!=', $abaikanId))
            // beririsan jika mulai_lain < selesai_baru DAN selesai_lain > mulai_baru
            ->where('jam_mulai', '<', $data['jam_selesai'])
            ->where('jam_selesai', '>', $data['jam_mulai']);
    }
}
