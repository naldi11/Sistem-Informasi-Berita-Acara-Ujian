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
use App\Models\PermohonanGantiPengawas;
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
            abort(403, 'Profil Pengawas tidak ditemukan.');
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
        $todaySchedules = JadwalUjian::with(['mataKuliah.dosenPengampu', 'beritaAcara'])
            ->where('nip_dosen', $dosen->nip)
            ->where(function ($query) {
                $query->where('tanggal', date('Y-m-d'))
                      ->orWhere('status', 'berlangsung');
            })
            ->get();

        $latestSchedules = JadwalUjian::with(['mataKuliah.dosenPengampu', 'beritaAcara'])
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        $latestLogs = ActivityLog::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $dosens = Dosen::where('status', 'aktif')->where('nip', '!=', $dosen->nip)->select('nip', 'nama')->get();

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
            'dosens' => $dosens,
        ]);
    }

    public function jadwalIndex()
    {
        $dosen = $this->getDosen();
        $schedules = JadwalUjian::with([
            'mataKuliah.dosenPengampu',
            'pesertaUjians' => function ($q) {
                $q->select('id', 'jadwal_ujian_id');
            },
            'beritaAcara',
            // Status permohonan penggantian ditampilkan langsung pada barisnya,
            // menggantikan halaman Permohonan Penggantian yang terpisah.
            'permohonanGantiTerakhir.pengganti:nip,nama',
        ])
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->get();

        return Inertia::render('Dosen/Jadwal', [
            'schedules' => $schedules,
        ]);
    }

    /**
     * Ajukan penggantian pengawas untuk satu jadwal.
     *
     * Jadwalnya diambil dari URL — dosen mengeklik tombol pada baris jadwal yang
     * bersangkutan, jadi tidak perlu memilih jadwal lagi di dalam formulir.
     */
    public function storePermohonanPenggantian(Request $request, $jadwal)
    {
        $request->validate([
            'alasan' => 'required|string|min:10',
        ]);

        $dosen = $this->getDosen();
        $jadwal = JadwalUjian::where('nip_dosen', $dosen->nip)->findOrFail($jadwal);

        if (in_array($jadwal->status, ['selesai', 'dibatalkan'], true)) {
            return back()->withErrors([
                'alasan' => 'Jadwal ini sudah ' . $jadwal->status . ', penggantian pengawas tidak dapat diajukan.',
            ]);
        }

        // Cek apakah sudah ada permohonan pending untuk jadwal ini
        $existing = PermohonanGantiPengawas::where('jadwal_ujian_id', $jadwal->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return back()->withErrors(['alasan' => 'Anda sudah mengajukan permohonan untuk jadwal ini dan masih menunggu konfirmasi.']);
        }

        PermohonanGantiPengawas::create([
            'jadwal_ujian_id' => $jadwal->id,
            'dosen_pemohon_nip' => $dosen->nip,
            'alasan' => $request->alasan,
            'status' => 'pending',
        ]);

        $this->log("Mengajukan permohonan penggantian pengawas untuk jadwal ujian ID #{$jadwal->id}");

        return redirect()->back()->with('success', 'Permohonan penggantian pengawas berhasil diajukan dan menunggu konfirmasi admin.');
    }

    public function beritaAcaraIndex()
    {
        $dosen = $this->getDosen();
        
        // Get all schedules for the lecturer along with their berita acara
        $schedules = JadwalUjian::with(['mataKuliah.dosenPengampu', 'beritaAcara'])
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

        // Fallback: jika token kosong (misal jadwal dibuat saat revisi sebelumnya), generate ulang.
        if (empty($schedule->token)) {
            $schedule->token = strtoupper(\Illuminate\Support\Str::random(6));
            $schedule->save();
        }

        // Validate time window: only allow DURING the exam (jam_mulai s/d jam_selesai on exam date)
        $now       = \Carbon\Carbon::now();
        $examStart = \Carbon\Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_mulai);
        $examEnd   = \Carbon\Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_selesai);

        if ($now->lt($examStart)) {
            return redirect()->route('dosen.berita-acara')
                ->with('error', 'Berita Acara belum dapat diisi. Ujian belum dimulai (mulai pukul ' . $examStart->format('H:i') . ').');
        }

        if ($now->gt($examEnd)) {
            return redirect()->route('dosen.berita-acara')
                ->with('error', 'Batas pengisian Berita Acara telah lewat. Hanya dapat diisi selama ujian berlangsung (s/d pukul ' . $examEnd->format('H:i') . ').');
        }

        return Inertia::render('Dosen/InputBAU', [
            'schedule' => $schedule,
        ]);
    }

    public function saveBeritaAcara(Request $request, $jadwal_id)
    {
        $dosen = $this->getDosen();
        $schedule = JadwalUjian::where('nip_dosen', $dosen->nip)->findOrFail($jadwal_id);

        $request->validate([
            'jam_mulai_aktual'  => 'required',
            'jam_selesai_aktual' => 'required',
            'catatan'           => 'nullable|string',
            'status_validasi'   => 'required|in:draft,menunggu_validasi',
            'attendance'        => 'required|array',
        ]);

        // Double-check time window on save: only during exam hours
        $now       = \Carbon\Carbon::now();
        $examStart = \Carbon\Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_mulai);
        $examEnd   = \Carbon\Carbon::parse($schedule->tanggal . ' ' . $schedule->jam_selesai);

        if ($now->lt($examStart) || $now->gt($examEnd)) {
            return back()->withErrors(['error' => 'Pengisian Berita Acara hanya diizinkan selama ujian berlangsung (' . $examStart->format('H:i') . ' s/d ' . $examEnd->format('H:i') . ').']);
        }

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
        
        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah.dosenPengampu', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
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
            'qrCode' => $bau->generateQrCode(),
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

    public function panduanIndex()
    {
        return Inertia::render('Dosen/Panduan');
    }
}
