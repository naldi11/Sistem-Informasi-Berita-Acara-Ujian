<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Mahasiswa;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use App\Models\Setting;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MahasiswaAttendanceController extends Controller
{
    /**
     * Display student login view.
     */
    public function showLogin()
    {
        if (session()->has('mahasiswa_nim')) {
            return redirect()->route('mahasiswa.dashboard');
        }

        return Inertia::render('Mahasiswa/Login');
    }

    /**
     * Authenticate student and start session.
     */
    public function login(Request $request)
    {
        $request->validate([
            'nim' => 'required|string|exists:mahasiswas,nim',
            'password' => 'required|string',
        ], [
            'nim.exists' => 'NIM tidak terdaftar di sistem.',
        ]);

        $nim = $request->nim;
        $password = $request->password;

        $mahasiswa = Mahasiswa::where('nim', $nim)->first();
        if ($mahasiswa->status !== 'aktif') {
            return back()->withErrors(['nim' => 'Status mahasiswa tidak aktif. Hubungi BAU/Fakultas.']);
        }

        if (!\Illuminate\Support\Facades\Hash::check($password, $mahasiswa->password)) {
            return back()->withErrors(['password' => 'Kata sandi Anda salah.']);
        }

        // Store session
        session(['mahasiswa_nim' => $mahasiswa->nim]);

        return redirect()->route('mahasiswa.dashboard')->with('success', 'Selamat datang kembali, ' . $mahasiswa->nama . '!');
    }

    /**
     * Log out student and clear session.
     */
    public function logout()
    {
        session()->forget('mahasiswa_nim');
        return redirect()->route('mahasiswa.login')->with('success', 'Anda telah berhasil keluar.');
    }

    /**
     * Display student dashboard with schedules.
     */
    public function dashboard()
    {
        if (!session()->has('mahasiswa_nim')) {
            return redirect()->route('mahasiswa.login')->with('error', 'Silakan masuk terlebih dahulu.');
        }

        $nim = session('mahasiswa_nim');
        $mahasiswa = Mahasiswa::with('programStudi')->findOrFail($nim);

        $schedules = JadwalUjian::with(['mataKuliah', 'dosen'])
            ->whereHas('pesertaUjians', function ($query) use ($nim) {
                $query->where('nim', $nim);
            })
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->get()
            ->map(function ($exam) use ($nim) {
                $peserta = PesertaUjian::where('jadwal_ujian_id', $exam->id)
                    ->where('nim', $nim)
                    ->first();
                
                $exam->kehadiran = $peserta ? $peserta->kehadiran : 'belum_ditentukan';
                
                $now = Carbon::now();
                $examStart = Carbon::parse($exam->tanggal . ' ' . $exam->jam_mulai)->subMinutes(15);
                $examEnd   = Carbon::parse($exam->tanggal . ' ' . $exam->jam_selesai)->addMinutes(15);
                
                $exam->is_active = $now->between($examStart, $examEnd) && in_array($exam->status, ['terjadwal', 'berlangsung']);
                
                return $exam;
            });

        return Inertia::render('Mahasiswa/Dashboard', [
            'mahasiswa' => $mahasiswa,
            'schedules' => $schedules,
        ]);
    }

    /**
     * Display dedicated exam attendance form.
     */
    public function absenForm($jadwal_id)
    {
        if (!session()->has('mahasiswa_nim')) {
            return redirect()->route('mahasiswa.login')->with('error', 'Silakan masuk terlebih dahulu.');
        }

        $nim = session('mahasiswa_nim');
        $schedule = JadwalUjian::with(['mataKuliah', 'dosen'])->findOrFail($jadwal_id);

        // Verify enrollment
        $peserta = PesertaUjian::where('jadwal_ujian_id', $jadwal_id)
            ->where('nim', $nim)
            ->first();

        if (!$peserta) {
            return redirect()->route('mahasiswa.dashboard')->with('error', 'Anda tidak terdaftar sebagai peserta ujian ini.');
        }

        if ($peserta->kehadiran === 'hadir') {
            return redirect()->route('mahasiswa.dashboard')->with('error', 'Anda sudah melakukan absensi untuk ujian ini.');
        }

        // Verify active time slot (including 15-minute buffer)
        $now = Carbon::now();
        $examStart = Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_mulai)->subMinutes(15);
        $examEnd   = Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_selesai)->addMinutes(15);

        if (!$now->between($examStart, $examEnd) || !in_array($schedule->status, ['terjadwal', 'berlangsung'])) {
            return redirect()->route('mahasiswa.dashboard')->with('error', 'Waktu absensi untuk ujian ini belum dimulai atau sudah berakhir.');
        }

        $settings = [
            'token_enabled' => Setting::getValue('attendance_token_enabled', true),
            'gps_enabled'   => Setting::getValue('attendance_gps_enabled', false),
            'ip_enabled'    => Setting::getValue('attendance_ip_enabled', false),
        ];

        return Inertia::render('Mahasiswa/Absen', [
            'schedule' => [
                'id'          => $schedule->id,
                'nama_mk'     => $schedule->mataKuliah->nama_mk,
                'kode_mk'     => $schedule->kode_mk,
                'kelas'       => $schedule->kelas,
                'ruang'       => $schedule->ruang,
                'dosen_nama'  => $schedule->dosen?->nama,
                'jam_mulai'   => substr($schedule->jam_mulai, 0, 5),
                'jam_selesai' => substr($schedule->jam_selesai, 0, 5),
                'jenis_ujian' => $schedule->jenis_ujian,
            ],
            'settings' => $settings,
        ]);
    }

    /**
     * Submit and record student exam attendance.
     */
    public function submitAttendance(Request $request)
    {
        $request->validate([
            'nim'             => 'required|string|exists:mahasiswas,nim',
            'jadwal_ujian_id' => 'required|exists:jadwal_ujians,id',
            'token'           => 'required|string',
            'latitude'        => 'nullable|numeric',
            'longitude'       => 'nullable|numeric',
        ]);

        $nim = $request->nim;
        $jadwalId = $request->jadwal_ujian_id;

        $schedule = JadwalUjian::with('mataKuliah')->findOrFail($jadwalId);

        // Double check time slot
        $now = Carbon::now();
        $examStart = Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_mulai)->subMinutes(15);
        $examEnd   = Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_selesai)->addMinutes(15);

        if ($now->lt($examStart) || $now->gt($examEnd)) {
            return back()->withErrors(['error' => 'Waktu absensi untuk ujian ini sudah ditutup atau belum dimulai.']);
        }

        // Double check student enrollment and current status
        $peserta = PesertaUjian::where('jadwal_ujian_id', $jadwalId)
            ->where('nim', $nim)
            ->first();

        if (!$peserta) {
            return back()->withErrors(['error' => 'Anda tidak terdaftar sebagai peserta ujian ini.']);
        }

        if ($peserta->kehadiran === 'hadir') {
            return back()->withErrors(['error' => 'Anda sudah melakukan absensi untuk ujian ini.']);
        }

        // --- LAYER 1: NETWORK IP CHECK ---
        $ipEnabled = Setting::getValue('attendance_ip_enabled', false);
        if ($ipEnabled) {
            $clientIp = $request->ip();
            $allowedIpString = Setting::getValue('campus_ip_whitelist', '');
            $allowedRanges = explode(',', $allowedIpString);

            if (!$this->ipInRanges($clientIp, $allowedRanges)) {
                // For local debugging, we log client IP for admin reference
                return back()->withErrors(['error' => "Anda mendeteksi terhubung di luar jaringan kampus. Hubungkan perangkat Anda ke Wi-Fi Kampus! (IP Anda: {$clientIp})"]);
            }
        }

        // --- LAYER 2: EXAM ROOM TOKEN CHECK ---
        $tokenEnabled = Setting::getValue('attendance_token_enabled', true);
        if ($tokenEnabled) {
            if (!$request->token) {
                return back()->withErrors(['token' => 'Token absensi wajib diisi. Silakan lihat di papan tulis/tanyakan pengawas.']);
            }
            if (strtoupper(trim($request->token)) !== strtoupper(trim($schedule->token))) {
                return back()->withErrors(['token' => 'Token absensi ruangan tidak valid.']);
            }
        }

        // --- LAYER 3: GPS GEOFENCING CHECK ---
        $gpsEnabled = Setting::getValue('attendance_gps_enabled', false);
        if ($gpsEnabled) {
            if (is_null($request->latitude) || is_null($request->longitude)) {
                return back()->withErrors(['error' => 'Akses lokasi (GPS) diperlukan untuk verifikasi absensi di dalam ruang ujian.']);
            }

            $campusLat = (double) Setting::getValue('campus_latitude', -5.1476);
            $campusLng = (double) Setting::getValue('campus_longitude', 119.4328);
            $maxRadius = (double) Setting::getValue('campus_radius', 100); // meters

            $distance = $this->calculateDistance(
                (double) $request->latitude,
                (double) $request->longitude,
                $campusLat,
                $campusLng
            );

            if ($distance > $maxRadius) {
                $roundedDistance = round($distance);
                return back()->withErrors(['error' => "Absensi Ditolak! Anda terdeteksi berada {$roundedDistance} meter di luar jangkauan kampus (Maksimum: {$maxRadius} meter). Pastikan Anda berada di ruang ujian!"]);
            }
        }

        // All checks passed! Record attendance
        DB::transaction(function () use ($peserta) {
            $peserta->update([
                'kehadiran'    => 'hadir',
            ]);
        });

        // Log to activity log
        ActivityLog::create([
            'user_id' => null, // null denotes system/student public action
            'aktivitas' => "Mahasiswa NIM {$nim} sukses absen mandiri ujian: {$schedule->mataKuliah->nama_mk} (Kelas {$schedule->kelas}, Ruang {$schedule->ruang})",
        ]);

        return redirect()->route('mahasiswa.dashboard')->with('success', 'Absensi Ujian Berhasil! Semoga ujian Anda sukses!');
    }

    /**
     * Compute Haversine distance in meters.
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meters

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return $angle * $earthRadius;
    }

    /**
     * Check if IP address matches any of the whitelisted ranges.
     */
    private function ipInRanges($ip, array $ranges)
    {
        foreach ($ranges as $range) {
            $range = trim($range);
            if (empty($range)) continue;

            // Exact match
            if ($ip === $range) {
                return true;
            }

            // Wildcard match e.g. 192.168.1.*
            if (str_contains($range, '*')) {
                $pattern = '/^' . str_replace(['.', '*'], ['\.', '\d+'], $range) . '$/';
                if (preg_match($pattern, $ip)) {
                    return true;
                }
            }

            // CIDR match e.g. 192.168.1.0/24
            if (str_contains($range, '/')) {
                if ($this->ipCIDRMatch($ip, $range)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * CIDR Range checker.
     */
    private function ipCIDRMatch($ip, $cidr)
    {
        list($subnet, $bits) = explode('/', $cidr);
        $ip = ip2long($ip);
        $subnet = ip2long($subnet);
        $mask = -1 << (32 - $bits);
        $subnet &= $mask;
        return ($ip & $mask) == $subnet;
    }
}
