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
use App\Support\TanggalIndonesia;
use Barryvdh\DomPDF\Facade\Pdf;

class DosenController extends Controller
{
    private const PER_PAGE = 25;

    private function log($activity)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'aktivitas' => $activity,
        ]);
    }

    private function getDosen(): Dosen
    {
        $user = Auth::user();

        if (!$user) {
            abort(403, 'Anda tidak terautentikasi.');
        }

        $dosen = $user->dosen;

        // Sebelumnya profil yang hilang dibuat otomatis dengan prodi & jabatan
        // karangan ('AKT'/'Lektor'). Itu memalsukan data master secara diam-diam,
        // jadi sekarang sistem menolak dan meminta admin melengkapinya.
        if (!$dosen) {
            abort(403, 'Profil dosen untuk akun ini belum terdaftar. Hubungi administrator untuk melengkapi data dosen Anda.');
        }

        if ($dosen->status !== 'aktif') {
            abort(403, 'Status kepegawaian Anda tidak aktif. Hubungi administrator.');
        }

        return $dosen;
    }

    public function dashboard()
    {
        $dosen = $this->getDosen();

        // Satu query bergrup untuk seluruh cacahan status BAU.
        $bauCounts = BeritaAcara::query()
            ->whereHas('jadwalUjian', fn ($q) => $q->where('nip_dosen', $dosen->nip))
            ->selectRaw('status_validasi, COUNT(*) as jumlah')
            ->groupBy('status_validasi')
            ->pluck('jumlah', 'status_validasi');

        $todaySchedules = JadwalUjian::with('mataKuliah:kode_mk,nama_mk')
            ->where('nip_dosen', $dosen->nip)
            ->where(function ($query) {
                $query->where('tanggal', date('Y-m-d'))->orWhere('status', 'berlangsung');
            })
            ->orderBy('jam_mulai')
            ->get();

        $latestSchedules = JadwalUjian::with('mataKuliah:kode_mk,nama_mk')
            ->where('nip_dosen', $dosen->nip)
            ->orderBy('tanggal', 'desc')
            ->limit(5)
            ->get();

        $latestLogs = ActivityLog::where('user_id', Auth::id())
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Dosen/Dashboard', [
            'stats' => [
                'total_jadwal' => JadwalUjian::where('nip_dosen', $dosen->nip)->count(),
                'pending_bau' => $bauCounts['menunggu_validasi'] ?? 0,
                'validated_bau' => $bauCounts['tervalidasi'] ?? 0,
                'draft_bau' => $bauCounts['draft'] ?? 0,
            ],
            'todaySchedules' => $todaySchedules,
            'latestSchedules' => $latestSchedules,
            'latestLogs' => $latestLogs,
        ]);
    }

    public function jadwalIndex(Request $request)
    {
        $dosen = $this->getDosen();
        $cari = trim((string) $request->query('cari', ''));

        $schedules = JadwalUjian::query()
            // Tanpa select eksplisit, seluruh tanda tangan base64 peserta ikut
            // terkirim ke browser padahal halaman ini tidak menampilkannya.
            ->with('mataKuliah:kode_mk,nama_mk')
            ->withCount('pesertaUjians')
            ->where('nip_dosen', $dosen->nip)
            ->when($cari !== '', fn ($q) => $q->where(function ($sub) use ($cari) {
                $sub->where('kelas', 'like', "%{$cari}%")
                    ->orWhere('ruang', 'like', "%{$cari}%")
                    ->orWhereHas('mataKuliah', fn ($m) => $m->where('nama_mk', 'like', "%{$cari}%"));
            }))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('Dosen/Jadwal', [
            'schedules' => $schedules,
            'filters' => ['cari' => $cari],
        ]);
    }

    public function beritaAcaraIndex(Request $request)
    {
        $dosen = $this->getDosen();
        $cari = trim((string) $request->query('cari', ''));

        $schedules = JadwalUjian::query()
            ->with(['mataKuliah:kode_mk,nama_mk', 'beritaAcara'])
            ->withCount('pesertaUjians')
            ->where('nip_dosen', $dosen->nip)
            ->when($cari !== '', fn ($q) => $q->where(function ($sub) use ($cari) {
                $sub->where('kelas', 'like', "%{$cari}%")
                    ->orWhereHas('mataKuliah', fn ($m) => $m->where('nama_mk', 'like', "%{$cari}%"));
            }))
            ->orderBy('tanggal', 'desc')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('Dosen/BeritaAcaraList', [
            'schedules' => $schedules,
            'filters' => ['cari' => $cari],
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
            // Berita Acara yang sudah tervalidasi hanya bisa dilihat, tidak diubah.
            'terkunci' => $schedule->beritaAcara?->status_validasi === 'tervalidasi',
        ]);
    }

    public function saveBeritaAcara(Request $request, $jadwal_id)
    {
        $dosen = $this->getDosen();
        $schedule = JadwalUjian::with('beritaAcara')
            ->where('nip_dosen', $dosen->nip)
            ->findOrFail($jadwal_id);

        if ($schedule->beritaAcara?->status_validasi === 'tervalidasi') {
            return redirect()->route('dosen.berita-acara')->with(
                'error',
                'Berita Acara ini sudah divalidasi dan tidak dapat diubah lagi.'
            );
        }

        // Kunci kehadiran hanya boleh berisi NIM yang benar-benar peserta ujian ini.
        $nimPeserta = PesertaUjian::where('jadwal_ujian_id', $schedule->id)->pluck('nim')->all();

        $validated = $request->validate([
            'jam_mulai_aktual' => 'required|date_format:H:i,H:i:s',
            'jam_selesai_aktual' => 'required|date_format:H:i,H:i:s|after:jam_mulai_aktual',
            'catatan' => 'nullable|string|max:2000',
            'status_validasi' => 'required|in:draft,menunggu_validasi',
            'attendance' => 'required|array',
            'attendance.*' => 'required|in:hadir,absen,belum_ditentukan',
            'nilai' => 'nullable|array',
            'nilai.*' => 'nullable|numeric|min:0|max:100',
            'signatures' => 'nullable|array',
            'signatures.*' => 'nullable|string',
        ]);

        $nimAsing = array_diff(array_keys($validated['attendance']), $nimPeserta);
        if ($nimAsing) {
            return redirect()->back()->withErrors([
                'attendance' => 'Terdapat NIM yang bukan peserta ujian ini: ' . implode(', ', array_slice($nimAsing, 0, 5)) . '.',
            ]);
        }

        $nilai = $validated['nilai'] ?? [];
        $signatures = $validated['signatures'] ?? [];

        DB::transaction(function () use ($validated, $nilai, $signatures, $schedule) {
            foreach ($validated['attendance'] as $nim => $status) {
                // Kolom hanya ditimpa bila memang dikirim, supaya pengiriman
                // sebagian tidak menghapus nilai atau tanda tangan yang sudah ada.
                $perubahan = ['kehadiran' => $status];
                if (array_key_exists($nim, $nilai)) {
                    $perubahan['nilai'] = $nilai[$nim];
                }
                if (array_key_exists($nim, $signatures)) {
                    $perubahan['tanda_tangan'] = $signatures[$nim];
                }

                PesertaUjian::where('jadwal_ujian_id', $schedule->id)
                    ->where('nim', $nim)
                    ->update($perubahan);
            }

            // Rekap dihitung ulang dari basis data, bukan dari cacahan yang
            // dikirim browser, supaya angka pada Berita Acara selalu cocok
            // dengan daftar peserta yang tersimpan.
            $rekap = PesertaUjian::where('jadwal_ujian_id', $schedule->id)
                ->selectRaw('kehadiran, COUNT(*) as jumlah')
                ->groupBy('kehadiran')
                ->pluck('jumlah', 'kehadiran');

            $diajukan = $validated['status_validasi'] === 'menunggu_validasi';

            BeritaAcara::updateOrCreate(
                ['jadwal_ujian_id' => $schedule->id],
                [
                    'jam_mulai_aktual' => $validated['jam_mulai_aktual'],
                    'jam_selesai_aktual' => $validated['jam_selesai_aktual'],
                    'catatan' => $validated['catatan'] ?? null,
                    'jumlah_hadir' => $rekap['hadir'] ?? 0,
                    'jumlah_absen' => $rekap['absen'] ?? 0,
                    'status_validasi' => $validated['status_validasi'],
                    'diajukan_pada' => $diajukan ? now() : null,
                ]
            );

            // Hanya pengajuan yang memajukan status jadwal. Menyimpan draft tidak
            // boleh menimpa status 'selesai' atau 'dibatalkan' yang sudah ada.
            if ($diajukan && $schedule->status !== 'selesai') {
                $schedule->update(['status' => 'berlangsung']);
            }
        });

        $this->log("Mengisi Berita Acara Ujian Jadwal #{$jadwal_id} sebagai {$validated['status_validasi']}");

        return redirect()->route('dosen.berita-acara')->with('success', 'Berita Acara berhasil disimpan.');
    }

    public function printPdf($id)
    {
        $dosen = $this->getDosen();

        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
            ->whereHas('jadwalUjian', fn ($q) => $q->where('nip_dosen', $dosen->nip))
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.berita_acara', [
            'bau' => $bau,
        ] + TanggalIndonesia::uraikan($bau->jadwalUjian->tanggal));

        return $pdf->stream("Berita_Acara_Ujian_{$bau->jadwalUjian->mataKuliah->nama_mk}_{$bau->jadwalUjian->kelas}.pdf");
    }

    public function laporanIndex(Request $request)
    {
        $dosen = $this->getDosen();

        $baus = BeritaAcara::query()
            ->with(['jadwalUjian.mataKuliah:kode_mk,nama_mk', 'jadwalUjian.dosen:nip,nama'])
            ->whereHas('jadwalUjian', fn ($q) => $q->where('nip_dosen', $dosen->nip))
            ->where('status_validasi', 'tervalidasi')
            ->latest('divalidasi_pada')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('Dosen/Laporan', [
            'baus' => $baus,
        ]);
    }
}
