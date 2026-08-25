<?php

namespace App\Support;

use DateTimeInterface;

/**
 * Pemformatan tanggal berbahasa Indonesia untuk cetak Berita Acara.
 */
class TanggalIndonesia
{
    public const HARI = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
    ];

    public const BULAN = [
        '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
        '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
        '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
    ];

    /**
     * Pecah sebuah tanggal menjadi komponen siap-cetak.
     *
     * @return array{dayName: string, dayNum: string, monthName: string, year: string}
     */
    public static function uraikan(DateTimeInterface|string|null $tanggal): array
    {
        $dt = $tanggal instanceof DateTimeInterface
            ? $tanggal
            : new \DateTime($tanggal ?: 'now');

        return [
            'dayName' => self::HARI[$dt->format('l')],
            'dayNum' => $dt->format('d'),
            'monthName' => self::BULAN[$dt->format('m')],
            'year' => $dt->format('Y'),
        ];
    }

    /**
     * Ubah teks tanggal Indonesia ("Senin, 08 Juni 2026") menjadi Y-m-d.
     * Mengembalikan null bila tidak dapat diurai, supaya pemanggil bisa
     * memutuskan sendiri — bukan diam-diam memakai tanggal hari ini.
     */
    public static function parse(mixed $nilai): ?string
    {
        if ($nilai === null || $nilai === '') {
            return null;
        }

        if ($nilai instanceof DateTimeInterface) {
            return $nilai->format('Y-m-d');
        }

        if (is_numeric($nilai)) {
            try {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($nilai)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        $teks = preg_replace('/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu),\s*/i', '', (string) $nilai);
        $teks = str_ireplace(
            array_values(self::BULAN),
            ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
            $teks
        );

        try {
            return (new \DateTime($teks))->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Urai rentang jam ("08.30 - 10.00") menjadi [mulai, selesai] format H:i:s.
     * Mengembalikan null bila format tidak dikenali.
     *
     * @return array{0: string, 1: string}|null
     */
    public static function parseRentangJam(mixed $nilai): ?array
    {
        if (!$nilai) {
            return null;
        }

        $bagian = explode('-', (string) $nilai);
        if (count($bagian) !== 2) {
            return null;
        }

        $normalkan = static function (string $jam): ?string {
            $jam = trim(str_replace('.', ':', $jam));
            if (!preg_match('/^(\d{1,2}):(\d{2})(:(\d{2}))?$/', $jam, $m)) {
                return null;
            }
            if ((int) $m[1] > 23 || (int) $m[2] > 59) {
                return null;
            }

            return sprintf('%02d:%02d:%02d', $m[1], $m[2], $m[4] ?? 0);
        };

        $mulai = $normalkan($bagian[0]);
        $selesai = $normalkan($bagian[1]);

        return ($mulai && $selesai) ? [$mulai, $selesai] : null;
    }
}
