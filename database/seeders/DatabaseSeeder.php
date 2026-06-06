<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\ProgramStudi;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed default Admin
        $admin = User::create([
            'name' => 'Admin Fakultas',
            'email' => 'admin@umi.ac.id',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'aktif',
        ]);

    //     // 2. Seed default Program Studi
    //     $prodis = [
    //         ['kode_prodi' => 'MNJ', 'nama_prodi' => 'S1 Manajemen', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
    //         ['kode_prodi' => 'AKT', 'nama_prodi' => 'S1 Akuntansi', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
    //         ['kode_prodi' => 'MIA', 'nama_prodi' => 'D3 Manajemen Informatika', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
    //         ['kode_prodi' => 'KAA', 'nama_prodi' => 'D3 Komputerisasi Akuntansi', 'fakultas' => 'Fakultas Ekonomi', 'status' => 'aktif'],
    //     ];
    //     foreach ($prodis as $p) {
    //         ProgramStudi::create($p);
    //     }

    //     // 3. Seed default Dosen (Demo Account)
    //     $demoDosen = Dosen::create([
    //         'nip' => '19850312001',
    //         'nama' => 'Dr. Andi Pratama',
    //         'kode_prodi' => 'AKT',
    //         'jabatan' => 'Lektor Kepala',
    //         'status' => 'aktif',
    //     ]);

    //     User::create([
    //         'name' => 'Dr. Andi Pratama',
    //         'email' => 'dosen@umi.ac.id',
    //         'password' => Hash::make('dosen123'),
    //         'role' => 'dosen',
    //         'nip' => '19850312001',
    //         'status' => 'aktif',
    //     ]);

    //     // 4. Parse Excel Schedules
    //     $perlengkapanDir = '/Applications/MAMP/htdocs/SIBAU/perlengkapan';
        
    //     $utsFile = $perlengkapanDir . '/jadwal UTS FE Semester Ganjil 2025_2026 by hari.xlsx';
    //     $uasFile = $perlengkapanDir . '/jadwal UAS FE Semester Ganjil 2025_2026_Yanti_Golda_Beta.xlsx';
    //     $studentFile = $perlengkapanDir . '/STATISTIKA EKONOMI&BISNIS(2AB).xls';

    //     $dosenMap = ['Dr. Andi Pratama' => '19850312001'];
    //     $courseMap = [];

    //     // Helper to get or create Dosen
    //     $getOrCreateDosen = function ($name) use (&$dosenMap) {
    //         $name = trim($name);
    //         if (empty($name)) return '19850312001'; // fallback
            
    //         // Check if already mapped
    //         if (isset($dosenMap[$name])) {
    //             return $dosenMap[$name];
    //         }

    //         // Create new Dosen
    //         $nip = '19800' . str_pad(count($dosenMap) + 1, 6, '0', STR_PAD_LEFT);
    //         $dosenMap[$name] = $nip;

    //         Dosen::create([
    //             'nip' => $nip,
    //             'nama' => $name,
    //             'kode_prodi' => 'AKT', // default
    //             'jabatan' => 'Lektor',
    //             'status' => 'aktif',
    //         ]);

    //         // Create User account for Dosen
    //         $emailName = strtolower(preg_replace('/[^a-z]/', '', explode(' ', $name)[0] ?? 'dosen'));
    //         if (empty($emailName)) $emailName = 'dosen' . $nip;
    //         $email = $emailName . '.' . substr($nip, -4) . '@umi.ac.id';

    //         User::create([
    //             'name' => $name,
    //             'email' => $email,
    //             'password' => Hash::make('password123'),
    //             'role' => 'dosen',
    //             'nip' => $nip,
    //             'status' => 'aktif',
    //         ]);

    //         return $nip;
    //     };

    //     // Helper to get or create Course
    //     $getOrCreateCourse = function ($name, $sks) use (&$courseMap) {
    //         $name = trim($name);
    //         if (empty($name)) return 'MK-UNKNOWN';

    //         if (isset($courseMap[$name])) {
    //             return $courseMap[$name];
    //         }

    //         $code = 'MAK' . str_pad(count($courseMap) + 1, 3, '0', STR_PAD_LEFT);
    //         $courseMap[$name] = $code;

    //         MataKuliah::create([
    //             'kode_mk' => $code,
    //             'nama_mk' => $name,
    //             'sks' => is_numeric($sks) ? intval($sks) : 3,
    //             'kode_prodi' => 'AKT', // default
    //             'semester' => 3, // default
    //             'status' => 'aktif',
    //         ]);

    //         return $code;
    //     };

    //     // --- Process UTS file ---
    //     if (file_exists($utsFile)) {
    //         $spreadsheet = IOFactory::load($utsFile);
    //         $sheet = $spreadsheet->getActiveSheet();
    //         $rows = $sheet->toArray(null, true, true, true);

    //         foreach ($rows as $idx => $row) {
    //             if ($idx < 7) continue; // Skip headers

    //             $dateVal = $row['A'] ?? null;
    //             $jamVal = $row['B'] ?? null;
    //             $ruang1 = $row['C'] ?? null;
    //             $ruang2 = $row['D'] ?? null;
    //             $courseName = $row['E'] ?? null;
    //             $sks = $row['F'] ?? null;
    //             $kelas = $row['G'] ?? null;
    //             $jmlMhs = $row['H'] ?? null;
    //             $dosenName = $row['I'] ?? null;

    //             if (empty($courseName) || $courseName === 'Mata Kuliah' || !is_numeric($sks)) continue;

    //             $date = $this->parseDate($dateVal);
    //             $times = $this->parseTimeRange($jamVal);
                
    //             $nip = $getOrCreateDosen($dosenName);
    //             $kode_mk = $getOrCreateCourse($courseName, $sks);

    //             JadwalUjian::create([
    //                 'kode_mk' => $kode_mk,
    //                 'nip_dosen' => $nip,
    //                 'tanggal' => $date,
    //                 'sesi' => 'UTS Sesi',
    //                 'jam_mulai' => $times[0],
    //                 'jam_selesai' => $times[1],
    //                 'ruang' => $ruang1 ?: 'R.101',
    //                 'kelas' => $kelas ?: 'A',
    //                 'jenis_ujian' => 'UTS',
    //                 'semester_aktif' => 'Ganjil 2025/2026',
    //                 'tahun_akademik' => '2025/2026',
    //                 'status' => 'terjadwal',
    //             ]);
    //         }
    //     }

    //     // --- Process UAS file ---
    //     if (file_exists($uasFile)) {
    //         $spreadsheet = IOFactory::load($uasFile);
    //         $sheet = $spreadsheet->getActiveSheet();
    //         $rows = $sheet->toArray(null, true, true, true);

    //         foreach ($rows as $idx => $row) {
    //             if ($idx < 7) continue; // Skip headers

    //             $dateVal = $row['B'] ?? null; // note B is date in UAS file
    //             $jamVal = $row['C'] ?? null;
    //             $ruang1 = $row['D'] ?? null;
    //             $ruang2 = $row['E'] ?? null;
    //             $courseName = $row['F'] ?? null;
    //             $sks = $row['G'] ?? null;
    //             $kelas = $row['H'] ?? null;
    //             $jmlMhs = $row['I'] ?? null;
    //             $dosenName = $row['J'] ?? null;

    //             if (empty($courseName) || $courseName === 'Mata Kuliah' || !is_numeric($sks)) continue;

    //             $date = $this->parseDate($dateVal);
    //             $times = $this->parseTimeRange($jamVal);

    //             $nip = $getOrCreateDosen($dosenName);
    //             $kode_mk = $getOrCreateCourse($courseName, $sks);

    //             JadwalUjian::create([
    //                 'kode_mk' => $kode_mk,
    //                 'nip_dosen' => $nip,
    //                 'tanggal' => $date,
    //                 'sesi' => 'UAS Sesi',
    //                 'jam_mulai' => $times[0],
    //                 'jam_selesai' => $times[1],
    //                 'ruang' => $ruang1 ?: 'R.101',
    //                 'kelas' => $kelas ?: 'A',
    //                 'jenis_ujian' => 'UAS',
    //                 'semester_aktif' => 'Ganjil 2025/2026',
    //                 'tahun_akademik' => '2025/2026',
    //                 'status' => 'terjadwal',
    //             ]);
    //         }
    //     }

    //     // --- Process student list from STATISTIKA EKONOMI&BISNIS(2AB).xls ---
    //     $importedStudents = [];
    //     if (file_exists($studentFile)) {
    //         $spreadsheet = IOFactory::load($studentFile);
    //         $sheet = $spreadsheet->getActiveSheet();
    //         $rows = $sheet->toArray(null, true, true, true);

    //         foreach ($rows as $idx => $row) {
    //             if ($idx < 28) continue; // Data starts at row 28
                
    //             $no = $row['C'] ?? null; // Col C is No
    //             $nim = $row['I'] ?? null; // Col I is NPM
    //             $nama = $row['P'] ?? null; // Col P is Nama
    //             $grade = $row['X'] ?? null; // Col X is UTS grade

    //             if (empty($nim) || !is_numeric($no)) continue;

    //             $mahasiswa = Mahasiswa::updateOrCreate([
    //                 'nim' => $nim,
    //             ], [
    //                 'nama' => $nama,
    //                 'kode_prodi' => 'AKT',
    //                 'angkatan' => '2024',
    //                 'status' => 'aktif',
    //             ]);

    //             $importedStudents[] = [
    //                 'nim' => $nim,
    //                 'nilai' => is_numeric($grade) ? $grade : null,
    //             ];
    //         }
    //     }

    //     // --- Generate Dummy Students for seeding schedules ---
    //     $firstNames = ['Ahmad', 'Budi', 'Cici', 'Deni', 'Evi', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko', 'Kartika', 'Lia', 'Maman', 'Novi', 'Oki', 'Putri', 'Rian', 'Siti', 'Tono', 'Uli', 'Vina', 'Wawan', 'Yanti', 'Zaki'];
    //     $lastNames = ['Saputra', 'Hartono', 'Prasetyo', 'Wijaya', 'Sari', 'Amelia', 'Hidayat', 'Siregar', 'Simanjuntak', 'Purba', 'Nainggolan', 'Sinaga', 'Marbun', 'Ginting', 'Sembiring', 'Lumbantoruan', 'Zai', 'Gultom', 'Siahaan', 'Flora'];

    //     $allMasterStudents = Mahasiswa::all();
    //     if ($allMasterStudents->count() < 50) {
    //         // Generate more master students
    //         for ($i = 0; $i < 150; $i++) {
    //             $nim = '22343' . str_pad($i + 1, 5, '0', STR_PAD_LEFT);
    //             $nama = $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    //             $prodiCodes = ['AKT', 'MNJ', 'MIA', 'KAA'];
                
    //             Mahasiswa::create([
    //                 'nim' => $nim,
    //                 'nama' => $nama,
    //                 'kode_prodi' => $prodiCodes[array_rand($prodiCodes)],
    //                 'angkatan' => '2023',
    //                 'status' => 'aktif',
    //             ]);
    //         }
    //         $allMasterStudents = Mahasiswa::all();
    //     }

    //     // Link students to JadwalUjian as participants
    //     $schedules = JadwalUjian::all();
    //     foreach ($schedules as $sched) {
    //         // Check if it is the specific Statistika Ekonomi exam
    //         $isStatistika = Str::contains(strtolower($sched->mataKuliah->nama_mk), 'statistika');
            
    //         if ($isStatistika && count($importedStudents) > 0) {
    //             // Link the real imported students
    //             foreach ($importedStudents as $stud) {
    //                 PesertaUjian::create([
    //                     'jadwal_ujian_id' => $sched->id,
    //                     'nim' => $stud['nim'],
    //                     'kehadiran' => 'belum_ditentukan',
    //                     'nilai' => null,
    //                     'tanda_tangan' => null,
    //                 ]);
    //             }
    //         } else {
    //             // Link 20-30 random students from the master data
    //             $randomStudents = $allMasterStudents->random(rand(20, 30));
    //             foreach ($randomStudents as $stud) {
    //                 PesertaUjian::create([
    //                     'jadwal_ujian_id' => $sched->id,
    //                     'nim' => $stud->nim,
    //                     'kehadiran' => 'belum_ditentukan',
    //                     'nilai' => null,
    //                     'tanda_tangan' => null,
    //                 ]);
    //             }
    //         }
    //     }

    //     // 5. Seed some mock Berita Acara (BAU) records to make the app alive
    //     $mockSchedules = JadwalUjian::with(['mataKuliah', 'dosen'])->limit(15)->get();
    //     foreach ($mockSchedules as $idx => $sched) {
    //         $statusValidasi = 'draft';
    //         if ($idx < 5) {
    //             $statusValidasi = 'tervalidasi';
    //             $sched->update(['status' => 'selesai']);
    //         } elseif ($idx < 10) {
    //             $statusValidasi = 'menunggu_validasi';
    //             $sched->update(['status' => 'berlangsung']);
    //         }

    //         // Calculate total students
    //         $participants = PesertaUjian::where('jadwal_ujian_id', $sched->id)->get();
            
    //         // Randomly mark some as present, some as absent, and set random grades
    //         $hadir = 0;
    //         $absen = 0;
    //         foreach ($participants as $pIdx => $p) {
    //             $kehadiran = ($pIdx % 8 === 0) ? 'absen' : 'hadir';
    //             if ($kehadiran === 'hadir') {
    //                 $hadir++;
    //                 $p->update([
    //                     'kehadiran' => 'hadir',
    //                     'nilai' => rand(70, 95),
    //                     'tanda_tangan' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDsz4vAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYGAgYx9u8A6wAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJFP...', // mock signature
    //                 ]);
    //             } else {
    //                 $absen++;
    //                 $p->update([
    //                     'kehadiran' => 'absen',
    //                     'nilai' => null,
    //                     'tanda_tangan' => null,
    //                 ]);
    //             }
    //         }

    //         \App\Models\BeritaAcara::create([
    //             'jadwal_ujian_id' => $sched->id,
    //             'jam_mulai_aktual' => $sched->jam_mulai,
    //             'jam_selesai_aktual' => $sched->jam_selesai,
    //             'catatan' => 'Pelaksanaan ujian berjalan tertib dan lancar. Tidak ada kecurangan.',
    //             'jumlah_hadir' => $hadir,
    //             'jumlah_absen' => $absen,
    //             'status_validasi' => $statusValidasi,
    //         ]);
            
    //         // Find a user account corresponding to the lecturer
    //         $lecturerUser = User::where('nip', $sched->nip_dosen)->first();
    //         $userId = $lecturerUser ? $lecturerUser->id : $admin->id;

    //         // Log the activity
    //         \App\Models\ActivityLog::create([
    //             'user_id' => $userId,
    //             'aktivitas' => "Mengisi berita acara mata kuliah {$sched->mataKuliah->nama_mk} Kelas {$sched->kelas}",
    //         ]);
    //     }
    // }

    // private function parseDate($cell)
    // {
    //     if (!$cell) return date('Y-m-d');
    //     if ($cell instanceof \DateTime) {
    //         return $cell->format('Y-m-d');
    //     }
    //     if (is_numeric($cell)) {
    //         try {
    //             return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($cell)->format('Y-m-d');
    //         } catch (\Exception $e) {
    //             // ignore
    //         }
    //     }
        
    //     try {
    //         // e.g. "Senin, 10 November 2025"
    //         $str = preg_replace('/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu),\s*/i', '', $cell);
    //         $months = [
    //             'januari' => 'january', 'februari' => 'february', 'maret' => 'march',
    //             'april' => 'april', 'mei' => 'may', 'juni' => 'june', 'juli' => 'july',
    //             'agustus' => 'august', 'september' => 'september', 'oktober' => 'october',
    //             'november' => 'november', 'desember' => 'december'
    //         ];
    //         $str = str_ireplace(array_keys($months), array_values($months), $str);
    //         $dt = new \DateTime($str);
    //         return $dt->format('Y-m-d');
    //     } catch (\Exception $e) {
    //         return date('Y-m-d');
    //     }
    // }

    // private function parseTimeRange($jamStr)
    // {
    //     if (!$jamStr) return ['08:30:00', '10:00:00'];
    //     $parts = explode('-', $jamStr);
    //     if (count($parts) === 2) {
    //         $start = trim(str_replace('.', ':', $parts[0]));
    //         $end = trim(str_replace('.', ':', $parts[1]));
    //         if (strlen($start) === 5) $start .= ':00';
    //         if (strlen($end) === 5) $end .= ':00';
    //         return [$start, $end];
    //     }
    //     return ['08:30:00', '10:00:00'];
    }
}
