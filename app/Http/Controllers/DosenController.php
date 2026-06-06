<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use App\Models\BeritaAcara;
use App\Models\ActivityLog;
use App\Models\Dosen;
use Barryvdh\DomPDF\Facade\Pdf;

class DosenController extends Controller
{
    private function log($activity)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'aktivitas' => $activity,
        ]);
    }

    private function getDosen()
    {
        $user = Auth::user();
        if (!$user) {
            abort(403, 'Anda tidak terautentikasi.');
        }

        $dosen = $user->dosen;
        if (!$dosen && $user->nip) {
            // Automatically self-heal the missing Dosen profile
            $dosen = Dosen::create([
                'nip' => $user->nip,
                'nama' => $user->name,
                'kode_prodi' => 'AKT', // default fallback
                'jabatan' => 'Lektor', // default fallback
                'status' => 'aktif',
            ]);
            
            // Reload relationship
            $user->load('dosen');
        }

        if (!$dosen) {
            abort(403, 'Profil Dosen tidak ditemukan.');
        }

        return $dosen;
    }

    public function dashboard()
    {
        $dosen = $this->getDosen();

        $mySchedulesCount = JadwalUjian::where('nip_dosen', $dosen->nip)->count();
        
        $pendingBAU = BeritaAcara::whereHas('jadwalUjian', function ($q) use ($dosen) {
            $q->where('nip_dosen', $dosen->nip);
        })->where('status_validasi', 'menunggu_validasi')->count();

        $validatedBAU = BeritaAcara::whereHas('jadwalUjian', function ($q) use ($dosen) {
            $q->where('nip_dosen', $dosen->nip);
        })->where('status_validasi', 'tervalidasi')->count();

        $draftBAU = BeritaAcara::whereHas('jadwalUjian', function ($q) use ($dosen) {
            $q->where('nip_dosen', $dosen->nip);
        })->where('status_validasi', 'draft')->count();

        // Get schedules for today or currently in progress
        $todaySchedules = JadwalUjian::with('mataKuliah')
            ->where('nip_dosen', $dosen->nip)
            ->where(function ($query) {
                $query->where('tanggal', date('Y-m-d'))
                      ->orWhere('status', 'berlangsung');
            })
            ->get();

        $latestSchedules = JadwalUjian::with('mataKuliah')
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        $latestLogs = ActivityLog::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dosen/Dashboard', [
            'stats' => [
                'total_jadwal' => $mySchedulesCount,
                'pending_bau' => $pendingBAU,
                'validated_bau' => $validatedBAU,
                'draft_bau' => $draftBAU,
            ],
            'todaySchedules' => $todaySchedules,
            'latestSchedules' => $latestSchedules,
            'latestLogs' => $latestLogs,
        ]);
    }

    public function jadwalIndex()
    {
        $dosen = $this->getDosen();
        $schedules = JadwalUjian::with(['mataKuliah', 'pesertaUjians.mahasiswa'])
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->get();

        return Inertia::render('Dosen/Jadwal', [
            'schedules' => $schedules,
        ]);
    }

    public function beritaAcaraIndex()
    {
        $dosen = $this->getDosen();
        
        // Get all schedules for the lecturer along with their berita acara
        $schedules = JadwalUjian::with(['mataKuliah', 'beritaAcara'])
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->get();

        return Inertia::render('Dosen/BeritaAcaraList', [
            'schedules' => $schedules,
        ]);
    }

    public function inputBeritaAcara($jadwal_id)
    {
        $dosen = $this->getDosen();
        
        $schedule = JadwalUjian::with(['mataKuliah', 'pesertaUjians.mahasiswa', 'beritaAcara'])
            ->where('nip_dosen', $dosen->nip)
            ->findOrFail($jadwal_id);

        return Inertia::render('Dosen/InputBAU', [
            'schedule' => $schedule,
        ]);
    }

    public function saveBeritaAcara(Request $request, $jadwal_id)
    {
        $dosen = $this->getDosen();
        $schedule = JadwalUjian::where('nip_dosen', $dosen->nip)->findOrFail($jadwal_id);

        $request->validate([
            'jam_mulai_aktual' => 'required',
            'jam_selesai_aktual' => 'required',
            'catatan' => 'nullable|string',
            'status_validasi' => 'required|in:draft,menunggu_validasi',
            'attendance' => 'required|array', // key is student nim, value is 'hadir' or 'absen'
            'nilai' => 'nullable|array', // key is student nim, value is numeric
            'signatures' => 'nullable|array', // key is student nim, value is base64 signature string
        ]);

        DB::transaction(function () use ($request, $schedule, $jadwal_id) {
            // Calculate total hadir/absen
            $hadir = 0;
            $absen = 0;
            foreach ($request->attendance as $nim => $status) {
                if ($status === 'hadir') $hadir++;
                else if ($status === 'absen') $absen++;

                PesertaUjian::where('jadwal_ujian_id', $schedule->id)
                    ->where('nim', $nim)
                    ->update([
                        'kehadiran' => $status,
                        'nilai' => $request->nilai[$nim] ?? null,
                        'tanda_tangan' => $request->signatures[$nim] ?? null,
                    ]);
            }

            // Create or update Berita Acara
            BeritaAcara::updateOrCreate([
                'jadwal_ujian_id' => $schedule->id,
            ], [
                'jam_mulai_aktual' => $request->jam_mulai_aktual,
                'jam_selesai_aktual' => $request->jam_selesai_aktual,
                'catatan' => $request->catatan,
                'jumlah_hadir' => $hadir,
                'jumlah_absen' => $absen,
                'status_validasi' => $request->status_validasi,
            ]);

            // Update schedule status
            if ($request->status_validasi === 'menunggu_validasi') {
                $schedule->update([
                    'status' => 'berlangsung',
                ]);
            } else {
                $schedule->update([
                    'status' => 'terjadwal',
                ]);
            }
        });

        $this->log("Mengisi Berita Acara Ujian Jadwal #{$jadwal_id} sebagai {$request->status_validasi}");
        return redirect()->route('dosen.berita-acara')->with('success', 'Berita Acara berhasil disimpan.');
    }

    public function printPdf($id)
    {
        $dosen = $this->getDosen();
        
        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
            ->whereHas('jadwalUjian', function ($q) use ($dosen) {
                $q->where('nip_dosen', $dosen->nip);
            })
            ->findOrFail($id);

        $days = ['Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu'];
        $months = ['01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April', '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus', '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'];

        $dt = new \DateTime($bau->jadwalUjian->tanggal);
        $dayName = $days[$dt->format('l')];
        $dayNum = $dt->format('d');
        $monthName = $months[$dt->format('m')];
        $year = $dt->format('Y');

        $pdf = Pdf::loadView('pdf.berita_acara', [
            'bau' => $bau,
            'dayName' => $dayName,
            'dayNum' => $dayNum,
            'monthName' => $monthName,
            'year' => $year,
        ]);

        return $pdf->stream("Berita_Acara_Ujian_{$bau->jadwalUjian->mataKuliah->nama_mk}_{$bau->jadwalUjian->kelas}.pdf");
    }

    public function laporanIndex()
    {
        $dosen = $this->getDosen();
        $baus = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen'])
            ->whereHas('jadwalUjian', function ($q) use ($dosen) {
                $q->where('nip_dosen', $dosen->nip);
            })
            ->where('status_validasi', 'tervalidasi')
            ->get();

        return Inertia::render('Dosen/Laporan', [
            'baus' => $baus,
        ]);
    }
}
