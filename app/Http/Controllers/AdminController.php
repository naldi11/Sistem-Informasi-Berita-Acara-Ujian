<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use App\Models\User;
use App\Models\ProgramStudi;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\JadwalUjian;
use App\Models\PesertaUjian;
use App\Models\BeritaAcara;
use App\Models\ActivityLog;
use App\Support\JadwalValidator;
use App\Support\TanggalIndonesia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminController extends Controller
{
    /** Jumlah baris per halaman untuk seluruh daftar admin. */
    private const PER_PAGE = 25;

    private function log($activity)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'aktivitas' => $activity,
        ]);
    }

    public function dashboard()
    {
        // Satu query untuk seluruh cacahan status BAU, bukan empat query terpisah.
        $bauCounts = BeritaAcara::query()
            ->selectRaw('status_validasi, COUNT(*) as jumlah')
            ->groupBy('status_validasi')
            ->pluck('jumlah', 'status_validasi');

        $todayFilter = function ($query) {
            $query->where('tanggal', date('Y-m-d'))->orWhere('status', 'berlangsung');
        };

        $latestLogs = ActivityLog::with('user:id,name')->latest()->limit(6)->get();

        $latestSchedules = JadwalUjian::with(['mataKuliah:kode_mk,nama_mk', 'dosen:nip,nama'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->limit(5)
            ->get();

        $activeToday = JadwalUjian::with(['mataKuliah:kode_mk,nama_mk', 'dosen:nip,nama'])
            ->where($todayFilter)
            ->orderBy('jam_mulai', 'asc')
            ->first();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_jadwal' => JadwalUjian::count(),
                'pending_bau' => $bauCounts['menunggu_validasi'] ?? 0,
                'validated_bau' => $bauCounts['tervalidasi'] ?? 0,
                'draft_bau' => $bauCounts['draft'] ?? 0,
                'total_dosen' => Dosen::where('status', 'aktif')->count(),
                'total_mahasiswa' => Mahasiswa::where('status', 'aktif')->count(),
                'total_today' => JadwalUjian::where($todayFilter)->count(),
            ],
            'latestLogs' => $latestLogs,
            'latestSchedules' => $latestSchedules,
            'activeToday' => $activeToday,
        ]);
    }

    // --- CRUD Dosen & Mahasiswa ---
    public function usersIndex(Request $request)
    {
        $cariDosen = trim((string) $request->query('cari_dosen', ''));
        $cariMahasiswa = trim((string) $request->query('cari_mahasiswa', ''));

        $dosens = Dosen::with('programStudi:kode_prodi,nama_prodi')
            ->when($cariDosen !== '', function ($q) use ($cariDosen) {
                $q->where(function ($sub) use ($cariDosen) {
                    $sub->where('nama', 'like', "%{$cariDosen}%")
                        ->orWhere('nip', 'like', "%{$cariDosen}%");
                });
            })
            ->orderBy('nama')
            ->paginate(self::PER_PAGE, ['*'], 'halaman_dosen')
            ->withQueryString();

        $mahasiswas = Mahasiswa::with('programStudi:kode_prodi,nama_prodi')
            ->when($cariMahasiswa !== '', function ($q) use ($cariMahasiswa) {
                $q->where(function ($sub) use ($cariMahasiswa) {
                    $sub->where('nama', 'like', "%{$cariMahasiswa}%")
                        ->orWhere('nim', 'like', "%{$cariMahasiswa}%");
                });
            })
            ->orderBy('nama')
            ->paginate(self::PER_PAGE, ['*'], 'halaman_mahasiswa')
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'dosens' => $dosens,
            'mahasiswas' => $mahasiswas,
            'prodis' => ProgramStudi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'courses' => MataKuliah::where('status', 'aktif')->orderBy('nama_mk')->get(),
            'filters' => [
                'cari_dosen' => $cariDosen,
                'cari_mahasiswa' => $cariMahasiswa,
                'tab' => $request->query('tab', 'dosen'),
            ],
            // Ditampilkan pada panel import agar admin tahu kata sandi apa yang
            // harus disampaikan ke dosen baru. Halaman ini khusus admin.
            'importDefaultPassword' => config('sibau.import_default_password') ?: null,
        ]);
    }

    public function storeDosen(Request $request)
    {
        $request->validate([
            'nip' => 'required|string|unique:dosens,nip|unique:users,nip',
            'nama' => 'required|string',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'jabatan' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'string', Password::defaults()],
            'ampu_mata_kuliah' => 'nullable|array',
            'ampu_mata_kuliah.*' => 'string|exists:mata_kuliahs,kode_mk',
            'ampu_kelas' => 'nullable|array',
            'ampu_kelas.*' => 'string',
        ]);

        DB::transaction(function () use ($request) {
            Dosen::create($request->only('nip', 'nama', 'kode_prodi', 'jabatan', 'ampu_mata_kuliah', 'ampu_kelas') + ['status' => 'aktif']);
            User::create([
                'name' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'dosen',
                'nip' => $request->nip,
                'status' => 'aktif',
            ]);
        });

        $this->log("Menambahkan dosen baru: {$request->nama} ({$request->nip})");
        return redirect()->back()->with('success', 'Dosen berhasil ditambahkan.');
    }

    public function updateDosen(Request $request, $nip)
    {
        $dosen = Dosen::findOrFail($nip);

        $request->validate([
            'nama' => 'required|string',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'jabatan' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
            // Opsional: admin dapat menyetel ulang password akun dosen.
            'password' => ['nullable', 'string', Password::defaults()],
            'ampu_mata_kuliah' => 'nullable|array',
            'ampu_mata_kuliah.*' => 'string|exists:mata_kuliahs,kode_mk',
            'ampu_kelas' => 'nullable|array',
            'ampu_kelas.*' => 'string',
        ]);

        DB::transaction(function () use ($request, $dosen) {
            $dosen->update($request->only('nama', 'kode_prodi', 'jabatan', 'status', 'ampu_mata_kuliah', 'ampu_kelas'));

            $user = User::where('nip', $dosen->nip)->first();
            if ($user) {
                $user->name = $request->nama;
                $user->status = $request->status;
                if ($request->filled('password')) {
                    $user->password = Hash::make($request->password);
                }
                $user->save();
            }
        });

        $this->log("Mengubah data dosen: {$request->nama} ({$nip})");
        return redirect()->back()->with('success', 'Data dosen berhasil diubah.');
    }

    public function deleteDosen($nip)
    {
        $dosen = Dosen::findOrFail($nip);

        // FK jadwal_ujians.nip_dosen memakai ON DELETE CASCADE: menghapus dosen
        // akan ikut menghapus jadwal, peserta, dan berita acaranya. Tolak.
        $jumlahJadwal = JadwalUjian::where('nip_dosen', $nip)->count();
        if ($jumlahJadwal > 0) {
            return redirect()->back()->with(
                'error',
                "Dosen {$dosen->nama} masih terpakai pada {$jumlahJadwal} jadwal ujian dan tidak dapat dihapus. "
                . 'Ubah statusnya menjadi nonaktif bila sudah tidak bertugas.'
            );
        }

        $name = $dosen->nama;

        DB::transaction(function () use ($dosen) {
            User::where('nip', $dosen->nip)->delete();
            $dosen->delete();
        });

        $this->log("Menghapus dosen: {$name} ({$nip})");
        return redirect()->back()->with('success', 'Dosen berhasil dihapus.');
    }

    public function storeMahasiswa(Request $request)
    {
        $request->validate([
            'nim' => 'required|string|unique:mahasiswas,nim',
            'nama' => 'required|string',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'angkatan' => 'required|string',
            'kelas' => 'required|string',
        ]);

        Mahasiswa::create($request->only('nim', 'nama', 'kode_prodi', 'angkatan', 'kelas') + ['status' => 'aktif']);

        $this->log("Menambahkan mahasiswa baru: {$request->nama} ({$request->nim})");
        return redirect()->back()->with('success', 'Mahasiswa berhasil ditambahkan.');
    }

    public function updateMahasiswa(Request $request, $nim)
    {
        $mahasiswa = Mahasiswa::findOrFail($nim);

        $request->validate([
            'nama' => 'required|string',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'angkatan' => 'required|string',
            'kelas' => 'required|string',
            'status' => 'required|in:aktif,cuti,nonaktif',
        ]);

        $mahasiswa->update($request->only('nama', 'kode_prodi', 'angkatan', 'kelas', 'status'));

        $this->log("Mengubah data mahasiswa: {$request->nama} ({$nim})");
        return redirect()->back()->with('success', 'Data mahasiswa berhasil diubah.');
    }

    public function deleteMahasiswa($nim)
    {
        $mahasiswa = Mahasiswa::findOrFail($nim);

        $jumlahPeserta = PesertaUjian::where('nim', $nim)->count();
        if ($jumlahPeserta > 0) {
            return redirect()->back()->with(
                'error',
                "Mahasiswa {$mahasiswa->nama} masih terdaftar pada {$jumlahPeserta} ujian dan tidak dapat dihapus. "
                . 'Ubah statusnya menjadi nonaktif bila sudah tidak aktif.'
            );
        }

        $name = $mahasiswa->nama;
        $mahasiswa->delete();

        $this->log("Menghapus mahasiswa: {$name} ({$nim})");
        return redirect()->back()->with('success', 'Mahasiswa berhasil dihapus.');
    }

    // --- CRUD Program Studi ---
    public function prodiIndex()
    {
        // withCount menggantikan dua query count per prodi (N+1).
        $prodis = ProgramStudi::query()
            ->withCount([
                'mataKuliahs as total_mk',
                'mahasiswas as total_mahasiswa' => fn ($q) => $q->where('status', 'aktif'),
            ])
            ->orderBy('nama_prodi')
            ->get()
            ->map(fn ($prodi) => [
                'kode_prodi' => $prodi->kode_prodi,
                'nama_prodi' => $prodi->nama_prodi,
                'fakultas' => $prodi->fakultas,
                'status' => $prodi->status,
                'daftar_kelas' => $prodi->daftar_kelas ?: [],
                'total_mk' => $prodi->total_mk,
                'total_mahasiswa' => $prodi->total_mahasiswa,
            ]);

        return Inertia::render('Prodi/Index', [
            'prodis' => $prodis,
        ]);
    }

    public function storeProdi(Request $request)
    {
        $request->validate([
            'kode_prodi' => 'required|string|unique:program_studis,kode_prodi',
            'nama_prodi' => 'required|string',
            'fakultas' => 'required|string',
        ]);

        ProgramStudi::create($request->only('kode_prodi', 'nama_prodi', 'fakultas') + ['status' => 'aktif']);

        $this->log("Menambahkan program studi: {$request->nama_prodi} ({$request->kode_prodi})");
        return redirect()->back()->with('success', 'Program Studi berhasil ditambahkan.');
    }

    public function updateProdi(Request $request, $kode_prodi)
    {
        $prodi = ProgramStudi::findOrFail($kode_prodi);

        $request->validate([
            'nama_prodi' => 'required|string',
            'fakultas' => 'required|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $prodi->update($request->only('nama_prodi', 'fakultas', 'status'));

        $this->log("Mengubah program studi: {$request->nama_prodi} ({$kode_prodi})");
        return redirect()->back()->with('success', 'Program Studi berhasil diubah.');
    }

    public function deleteProdi($kode_prodi)
    {
        $prodi = ProgramStudi::findOrFail($kode_prodi);

        $terpakai = MataKuliah::where('kode_prodi', $kode_prodi)->count()
            + Dosen::where('kode_prodi', $kode_prodi)->count()
            + Mahasiswa::where('kode_prodi', $kode_prodi)->count();

        if ($terpakai > 0) {
            return redirect()->back()->with(
                'error',
                "Program Studi {$prodi->nama_prodi} masih dipakai oleh {$terpakai} data (dosen/mahasiswa/mata kuliah) "
                . 'dan tidak dapat dihapus. Ubah statusnya menjadi nonaktif.'
            );
        }

        $name = $prodi->nama_prodi;
        $prodi->delete();

        $this->log("Menghapus program studi: {$name} ({$kode_prodi})");
        return redirect()->back()->with('success', 'Program Studi berhasil dihapus.');
    }

    public function updateKelasProdi(Request $request, $kode_prodi)
    {
        $prodi = ProgramStudi::findOrFail($kode_prodi);

        $request->validate([
            'daftar_kelas' => 'required|array',
            'daftar_kelas.*' => 'required|string|distinct',
        ]);

        $prodi->daftar_kelas = $request->daftar_kelas;
        $prodi->save();

        $this->log("Memperbarui daftar kelas untuk prodi: {$prodi->nama_prodi} (" . implode(', ', $request->daftar_kelas) . ")");
        return redirect()->back()->with('success', 'Daftar kelas berhasil diperbarui.');
    }

    // --- CRUD Mata Kuliah ---
    public function mataKuliahIndex()
    {
        return Inertia::render('MataKuliah/Index', [
            'courses' => MataKuliah::with('programStudi:kode_prodi,nama_prodi')->orderBy('nama_mk')->get(),
            'prodis' => ProgramStudi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
        ]);
    }

    public function storeMataKuliah(Request $request)
    {
        $request->validate([
            'kode_mk' => 'required|string|unique:mata_kuliahs,kode_mk',
            'nama_mk' => 'required|string',
            'sks' => 'required|integer|min:1|max:8',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'semester' => 'required|integer|min:1|max:8',
            'teori' => 'boolean',
            'praktek' => 'boolean',
        ]);

        if (!$request->teori && !$request->praktek) {
            return redirect()->back()->withErrors(['teori' => 'Pilih setidaknya salah satu tipe: Teori atau Praktek.']);
        }

        MataKuliah::create($request->only('kode_mk', 'nama_mk', 'sks', 'kode_prodi', 'semester') + [
            'teori' => $request->teori ? 1 : 0,
            'praktek' => $request->praktek ? 1 : 0,
            'status' => 'aktif'
        ]);

        $this->log("Menambahkan mata kuliah: {$request->nama_mk} ({$request->kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil ditambahkan.');
    }

    public function updateMataKuliah(Request $request, $kode_mk)
    {
        $course = MataKuliah::findOrFail($kode_mk);

        $request->validate([
            'nama_mk' => 'required|string',
            'sks' => 'required|integer|min:1|max:8',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'semester' => 'required|integer|min:1|max:8',
            'status' => 'required|in:aktif,nonaktif',
            'teori' => 'boolean',
            'praktek' => 'boolean',
        ]);

        if (!$request->teori && !$request->praktek) {
            return redirect()->back()->withErrors(['teori' => 'Pilih setidaknya salah satu tipe: Teori atau Praktek.']);
        }

        $course->update($request->only('nama_mk', 'sks', 'kode_prodi', 'semester', 'status') + [
            'teori' => $request->teori ? 1 : 0,
            'praktek' => $request->praktek ? 1 : 0,
        ]);

        $this->log("Mengubah mata kuliah: {$request->nama_mk} ({$kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil diubah.');
    }

    public function deleteMataKuliah($kode_mk)
    {
        $course = MataKuliah::findOrFail($kode_mk);

        // FK jadwal_ujians.kode_mk memakai ON DELETE CASCADE.
        $jumlahJadwal = JadwalUjian::where('kode_mk', $kode_mk)->count();
        if ($jumlahJadwal > 0) {
            return redirect()->back()->with(
                'error',
                "Mata kuliah {$course->nama_mk} masih terpakai pada {$jumlahJadwal} jadwal ujian dan tidak dapat dihapus. "
                . 'Ubah statusnya menjadi nonaktif.'
            );
        }

        $name = $course->nama_mk;
        $course->delete();

        $this->log("Menghapus mata kuliah: {$name} ({$kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil dihapus.');
    }

    // --- CRUD Jadwal Ujian ---
    public function jadwalIndex(Request $request)
    {
        $cari = trim((string) $request->query('cari', ''));
        $status = $request->query('status');
        $jenis = $request->query('jenis');

        $schedules = JadwalUjian::query()
            // Hanya kolom nim yang dibutuhkan halaman ini. Tanpa select ini,
            // seluruh tanda tangan base64 ikut terkirim ke browser.
            ->with(['mataKuliah:kode_mk,nama_mk', 'dosen:nip,nama', 'pesertaUjians:id,jadwal_ujian_id,nim'])
            ->withCount('pesertaUjians')
            ->when($cari !== '', function ($q) use ($cari) {
                $q->where(function ($sub) use ($cari) {
                    $sub->where('kelas', 'like', "%{$cari}%")
                        ->orWhere('ruang', 'like', "%{$cari}%")
                        ->orWhereHas('mataKuliah', fn ($m) => $m->where('nama_mk', 'like', "%{$cari}%"))
                        ->orWhereHas('dosen', fn ($d) => $d->where('nama', 'like', "%{$cari}%"));
                });
            })
            ->when(in_array($status, ['terjadwal', 'berlangsung', 'selesai', 'dibatalkan'], true),
                fn ($q) => $q->where('status', $status))
            ->when(in_array($jenis, ['UTS', 'UAS'], true), fn ($q) => $q->where('jenis_ujian', $jenis))
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        // Cacahan dihitung di server karena daftar sudah dipaginasi.
        $perStatus = JadwalUjian::selectRaw('status, COUNT(*) as jumlah')->groupBy('status')->pluck('jumlah', 'status');

        return Inertia::render('Jadwal/Index', [
            'schedules' => $schedules,
            'dosens' => Dosen::where('status', 'aktif')->orderBy('nama')->get(),
            'courses' => MataKuliah::where('status', 'aktif')->orderBy('nama_mk')->get(),
            'mahasiswas' => Mahasiswa::where('status', 'aktif')
                ->orderBy('nama')
                ->get(['nim', 'nama', 'kode_prodi', 'angkatan', 'kelas']),
            'prodis' => ProgramStudi::where('status', 'aktif')->orderBy('nama_prodi')->get(),
            'stats' => [
                'total' => array_sum($perStatus->all()),
                'terjadwal' => $perStatus['terjadwal'] ?? 0,
                'berlangsung' => $perStatus['berlangsung'] ?? 0,
                'selesai' => $perStatus['selesai'] ?? 0,
                'dibatalkan' => $perStatus['dibatalkan'] ?? 0,
            ],
            'filters' => ['cari' => $cari, 'status' => $status, 'jenis' => $jenis],
        ]);
    }

    /**
     * Aturan validasi jadwal, dipakai bersama store & update.
     *
     * @return array<string, mixed>
     */
    private function aturanJadwal(bool $denganStatus): array
    {
        return array_filter([
            'kode_mk' => 'required|string|exists:mata_kuliahs,kode_mk',
            'nip_dosen' => 'required|string|exists:dosens,nip',
            'tanggal' => 'required|date',
            'sesi' => 'nullable|string',
            'jam_mulai' => 'required|date_format:H:i,H:i:s',
            'jam_selesai' => 'required|date_format:H:i,H:i:s|after:jam_mulai',
            'ruang' => 'required|string',
            'kelas' => 'required|string',
            'jenis_ujian' => 'required|in:UTS,UAS',
            'semester_aktif' => 'required|string',
            'tahun_akademik' => 'required|string',
            'status' => $denganStatus ? 'required|in:terjadwal,berlangsung,selesai,dibatalkan' : null,
            'student_nims' => 'required|array|min:1',
            'student_nims.*' => 'string|distinct|exists:mahasiswas,nim',
        ]);
    }

    /**
     * Ambil data jadwal dari request dengan jam ternormalisasi ke H:i:s,
     * supaya perbandingan rentang waktu (deteksi bentrok) selalu benar.
     *
     * @return array<string, mixed>
     */
    private function dataJadwal(Request $request, bool $denganStatus): array
    {
        $kolom = ['kode_mk', 'nip_dosen', 'tanggal', 'sesi', 'ruang', 'kelas', 'jenis_ujian', 'semester_aktif', 'tahun_akademik'];
        if ($denganStatus) {
            $kolom[] = 'status';
        }

        return $request->only($kolom) + [
            'jam_mulai' => substr($request->jam_mulai, 0, 5) . ':00',
            'jam_selesai' => substr($request->jam_selesai, 0, 5) . ':00',
        ];
    }

    public function storeJadwal(Request $request)
    {
        $request->validate($this->aturanJadwal(denganStatus: false));

        $data = $this->dataJadwal($request, denganStatus: false);
        $nims = array_values(array_unique($request->student_nims));

        if ($errors = JadwalValidator::periksa($data, $nims)) {
            return redirect()->back()->withErrors($errors)->withInput();
        }

        DB::transaction(function () use ($data, $nims) {
            $jadwal = JadwalUjian::create($data + ['status' => 'terjadwal']);

            foreach ($nims as $nim) {
                PesertaUjian::create([
                    'jadwal_ujian_id' => $jadwal->id,
                    'nim' => $nim,
                    'kehadiran' => 'belum_ditentukan',
                ]);
            }
        });

        $this->log("Membuat jadwal ujian baru {$data['kode_mk']} Kelas {$data['kelas']}");
        return redirect()->back()->with('success', 'Jadwal ujian berhasil ditambahkan.');
    }

    public function updateJadwal(Request $request, $id)
    {
        $jadwal = JadwalUjian::with('beritaAcara')->findOrFail($id);

        // Berita Acara yang sudah tervalidasi adalah dokumen resmi; jadwalnya
        // tidak boleh diubah lagi tanpa membatalkan validasi terlebih dahulu.
        if ($jadwal->beritaAcara?->status_validasi === 'tervalidasi') {
            return redirect()->back()->with(
                'error',
                'Jadwal ini sudah memiliki Berita Acara tervalidasi dan tidak dapat diubah. '
                . 'Batalkan validasi Berita Acara terlebih dahulu bila memang perlu direvisi.'
            );
        }

        $request->validate($this->aturanJadwal(denganStatus: true));

        $data = $this->dataJadwal($request, denganStatus: true);
        $nims = array_values(array_unique($request->student_nims));

        if ($errors = JadwalValidator::periksa($data, $nims, abaikanId: (int) $jadwal->id)) {
            return redirect()->back()->withErrors($errors)->withInput();
        }

        DB::transaction(function () use ($data, $jadwal, $nims) {
            $jadwal->update($data);

            // Sinkronisasi peserta, BUKAN hapus-lalu-buat-ulang. Peserta yang
            // tetap terdaftar mempertahankan kehadiran, nilai, dan tanda tangannya.
            PesertaUjian::where('jadwal_ujian_id', $jadwal->id)
                ->whereNotIn('nim', $nims)
                ->delete();

            $sudahAda = PesertaUjian::where('jadwal_ujian_id', $jadwal->id)->pluck('nim')->all();

            foreach (array_diff($nims, $sudahAda) as $nim) {
                PesertaUjian::create([
                    'jadwal_ujian_id' => $jadwal->id,
                    'nim' => $nim,
                    'kehadiran' => 'belum_ditentukan',
                ]);
            }
        });

        $this->log("Mengubah jadwal ujian ID #{$id}");
        return redirect()->back()->with('success', 'Jadwal ujian berhasil diperbarui.');
    }

    public function deleteJadwal($id)
    {
        $jadwal = JadwalUjian::with('beritaAcara')->findOrFail($id);

        if ($jadwal->beritaAcara?->status_validasi === 'tervalidasi') {
            return redirect()->back()->with(
                'error',
                'Jadwal ini sudah memiliki Berita Acara tervalidasi dan tidak dapat dihapus. '
                . 'Ubah statusnya menjadi "dibatalkan" bila ujian tidak jadi dilaksanakan.'
            );
        }

        $jadwal->delete();

        $this->log("Menghapus jadwal ujian ID #{$id}");
        return redirect()->back()->with('success', 'Jadwal ujian berhasil dihapus.');
    }

    // --- Berita Acara (BAU) List & Validation ---
    public function beritaAcaraIndex(Request $request)
    {
        $cari = trim((string) $request->query('cari', ''));
        $status = $request->query('status');

        $baus = BeritaAcara::query()
            ->with(['jadwalUjian:id,kode_mk,nip_dosen,tanggal,kelas,ruang,jenis_ujian,status',
                    'jadwalUjian.mataKuliah:kode_mk,nama_mk',
                    'jadwalUjian.dosen:nip,nama'])
            ->when($cari !== '', fn ($q) => $q->whereHas('jadwalUjian', function ($j) use ($cari) {
                $j->where('kelas', 'like', "%{$cari}%")
                    ->orWhereHas('mataKuliah', fn ($m) => $m->where('nama_mk', 'like', "%{$cari}%"))
                    ->orWhereHas('dosen', fn ($d) => $d->where('nama', 'like', "%{$cari}%"));
            }))
            ->when(in_array($status, ['draft', 'menunggu_validasi', 'tervalidasi'], true),
                fn ($q) => $q->where('status_validasi', $status))
            ->latest('updated_at')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        $perStatus = BeritaAcara::selectRaw('status_validasi, COUNT(*) as jumlah')
            ->groupBy('status_validasi')
            ->pluck('jumlah', 'status_validasi');

        return Inertia::render('Admin/BeritaAcara', [
            'baus' => $baus,
            'stats' => [
                'total' => array_sum($perStatus->all()),
                'draft' => $perStatus['draft'] ?? 0,
                'menunggu_validasi' => $perStatus['menunggu_validasi'] ?? 0,
                'tervalidasi' => $perStatus['tervalidasi'] ?? 0,
            ],
            'filters' => ['cari' => $cari, 'status' => $status],
        ]);
    }

    /**
     * Transisi status validasi yang diizinkan.
     * BAU berstatus 'draft' belum diajukan dosen, jadi belum boleh divalidasi.
     */
    private const TRANSISI_VALIDASI = [
        'menunggu_validasi' => ['tervalidasi', 'draft'],
        'tervalidasi' => ['menunggu_validasi'],
        'draft' => [],
    ];

    public function validateBeritaAcara(Request $request, $id)
    {
        $request->validate([
            'status_validasi' => 'required|in:tervalidasi,draft,menunggu_validasi',
        ]);

        $bau = BeritaAcara::with('jadwalUjian')->findOrFail($id);
        $tujuan = $request->status_validasi;
        $asal = $bau->status_validasi;

        if ($tujuan !== $asal && !in_array($tujuan, self::TRANSISI_VALIDASI[$asal] ?? [], true)) {
            return redirect()->back()->withErrors([
                'status_validasi' => $asal === 'draft'
                    ? 'Berita Acara masih berstatus draft dan belum diajukan oleh dosen, sehingga belum dapat divalidasi.'
                    : "Perubahan status dari \"{$asal}\" ke \"{$tujuan}\" tidak diizinkan.",
            ]);
        }

        DB::transaction(function () use ($bau, $tujuan) {
            $bau->update([
                'status_validasi' => $tujuan,
                'divalidasi_oleh' => $tujuan === 'tervalidasi' ? Auth::id() : null,
                'divalidasi_pada' => $tujuan === 'tervalidasi' ? now() : null,
            ]);

            $bau->jadwalUjian?->update([
                'status' => $tujuan === 'tervalidasi' ? 'selesai' : 'berlangsung',
            ]);
        });

        $this->log("Memvalidasi berita acara ujian ID #{$id} menjadi: {$tujuan}");
        return redirect()->back()->with('success', 'Status validasi Berita Acara berhasil diperbarui.');
    }

    public function printBeritaAcaraPdf($id)
    {
        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.berita_acara', [
            'bau' => $bau,
        ] + TanggalIndonesia::uraikan($bau->jadwalUjian->tanggal));

        return $pdf->stream("Berita_Acara_Ujian_{$bau->jadwalUjian->mataKuliah->nama_mk}_{$bau->jadwalUjian->kelas}.pdf");
    }

    // --- Laporan & Rekapitulasi ---

    /**
     * Query rekapitulasi BAU dengan filter laporan.
     * Satu tempat untuk tampilan, ekspor PDF, dan ekspor Excel.
     */
    private function queryLaporan(Request $request)
    {
        return BeritaAcara::query()
            ->with(['jadwalUjian.mataKuliah:kode_mk,nama_mk', 'jadwalUjian.dosen:nip,nama'])
            ->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->when(
                    $request->start_date && $request->end_date,
                    fn ($j) => $j->whereBetween('tanggal', [$request->start_date, $request->end_date])
                )
                    ->when($request->kode_mk, fn ($j) => $j->where('kode_mk', $request->kode_mk))
                    ->when($request->nip_dosen, fn ($j) => $j->where('nip_dosen', $request->nip_dosen))
                    ->when($request->semester_aktif, fn ($j) => $j->where('semester_aktif', $request->semester_aktif));
            })
            ->latest('updated_at');
    }

    private function filterLaporan(Request $request): array
    {
        return $request->only('start_date', 'end_date', 'kode_mk', 'nip_dosen', 'semester_aktif');
    }

    public function laporanIndex(Request $request)
    {
        return Inertia::render('Admin/Laporan', [
            'baus' => $this->queryLaporan($request)->paginate(self::PER_PAGE)->withQueryString(),
            'courses' => MataKuliah::orderBy('nama_mk')->get(['kode_mk', 'nama_mk']),
            'dosens' => Dosen::orderBy('nama')->get(['nip', 'nama']),
            'filters' => $this->filterLaporan($request),
        ]);
    }

    public function exportLaporanPdf(Request $request)
    {
        $pdf = Pdf::loadView('pdf.rekap_laporan', [
            'baus' => $this->queryLaporan($request)->get(),
            'filters' => $this->filterLaporan($request),
        ]);

        return $pdf->download('rekap_laporan_bau.pdf');
    }

    public function exportLaporanExcel(Request $request)
    {
        $baus = $this->queryLaporan($request)->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'LAPORAN REKAPITULASI BERITA ACARA UJIAN (BAU)');
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $sheet->setCellValue('A2', 'FAKULTAS EKONOMI - UNIVERSITAS METHODIST INDONESIA');
        $sheet->mergeCells('A2:I2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);

        $periodText = ($request->start_date && $request->end_date)
            ? "Periode: {$request->start_date} s/d {$request->end_date}"
            : 'Periode: Semua';
        $sheet->setCellValue('A3', $periodText);
        $sheet->mergeCells('A3:I3');
        $sheet->getStyle('A3')->getFont()->setItalic(true);

        $headers = ['No', 'Kode MK', 'Nama Mata Kuliah', 'Dosen Penguji', 'Tanggal', 'Kelas', 'Hadir', 'Absen', 'Status Validasi'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        foreach ($headers as $colIdx => $header) {
            $sheet->setCellValue($cols[$colIdx] . '5', $header);
            $sheet->getStyle($cols[$colIdx] . '5')->getFont()->setBold(true);
            $sheet->getStyle($cols[$colIdx] . '5')->getBorders()->getBottom()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        }

        $rowIdx = 6;
        foreach ($baus as $idx => $b) {
            $sheet->setCellValue('A' . $rowIdx, $idx + 1);
            $sheet->setCellValue('B' . $rowIdx, $b->jadwalUjian?->kode_mk);
            $sheet->setCellValue('C' . $rowIdx, $b->jadwalUjian?->mataKuliah?->nama_mk);
            $sheet->setCellValue('D' . $rowIdx, $b->jadwalUjian?->dosen?->nama);
            $sheet->setCellValue('E' . $rowIdx, $b->jadwalUjian?->tanggal);
            $sheet->setCellValue('F' . $rowIdx, $b->jadwalUjian?->kelas);
            $sheet->setCellValue('G' . $rowIdx, $b->jumlah_hadir);
            $sheet->setCellValue('H' . $rowIdx, $b->jumlah_absen);
            $sheet->setCellValue('I' . $rowIdx, $b->status_validasi === 'tervalidasi' ? 'Valid' : 'Pending');
            $rowIdx++;
        }

        foreach ($cols as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return $this->unduhSpreadsheet($spreadsheet, 'rekap_laporan_bau.xlsx');
    }

    /**
     * Kirim spreadsheet sebagai unduhan lewat response Laravel.
     * Sebelumnya fungsi ekspor memakai header()+exit yang melewati penyimpanan
     * session dan middleware terminate.
     */
    private function unduhSpreadsheet(Spreadsheet $spreadsheet, string $filename)
    {
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(
            fn () => $writer->save('php://output'),
            $filename,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
            ]
        );
    }

    // --- Pengaturan / Settings ---
    public function pengaturanIndex()
    {
        return Inertia::render('Admin/Pengaturan', [
            'users' => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'nip', 'status', 'created_at']),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        $this->log('Mengubah profil admin sendiri');
        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function addStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:admin,dosen',
            'nip' => 'nullable|string|unique:users,nip',
            'password' => ['required', 'string', Password::defaults()],
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'nip' => $request->nip,
            'password' => Hash::make($request->password),
            'status' => 'aktif',
        ]);

        $this->log("Menambahkan staf baru: {$request->name} ({$request->role})");
        return redirect()->back()->with('success', 'Staf baru berhasil ditambahkan.');
    }

    public function deleteStaff($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $name = $user->name;
        $user->delete();

        $this->log("Menghapus staf: {$name}");
        return redirect()->back()->with('success', 'Staf berhasil dihapus.');
    }

    // --- Import Excel ---

    /**
     * Baca file Excel yang diunggah menjadi larik baris berindeks huruf kolom.
     *
     * @return array<int, array<string, mixed>>
     */
    private function bacaBarisExcel(Request $request): array
    {
        $spreadsheet = IOFactory::load($request->file('excel_file')->getRealPath());

        return $spreadsheet->getActiveSheet()->toArray(null, true, true, true);
    }

    /**
     * Rangkum hasil import menjadi pesan flash yang jujur: berapa masuk,
     * berapa dilewati, dan kenapa.
     */
    private function hasilImport(int $masuk, array $dilewati, string $label)
    {
        if ($masuk === 0) {
            $alasan = $dilewati ? ' ' . implode(' ', array_slice($dilewati, 0, 3)) : '';
            return redirect()->back()->with(
                'error',
                "Gagal mengimpor {$label}. Berkas tidak memiliki data yang valid atau format kolom salah.{$alasan}"
            );
        }

        $pesan = "Berhasil mengimpor {$masuk} {$label}.";
        if ($dilewati) {
            $jumlah = count($dilewati);
            $pesan .= " {$jumlah} baris dilewati: " . implode(' ', array_slice($dilewati, 0, 3));
            if ($jumlah > 3) {
                $pesan .= ' (dan ' . ($jumlah - 3) . ' lainnya)';
            }
        }

        $this->log("Mengimpor {$masuk} {$label} dari Excel");
        return redirect()->back()->with('success', $pesan);
    }

    /**
     * Buat akun dosen bila belum ada.
     *
     * Akun yang sudah ada TIDAK pernah ditimpa passwordnya oleh proses import —
     * dulu setiap impor ulang mereset kata sandi seluruh dosen.
     */
    private function pastikanAkunDosen(string $nip, string $nama, ?string $email = null): void
    {
        $user = User::where('nip', $nip)->first();

        if ($user) {
            $user->update(['name' => $nama, 'status' => 'aktif']);
            return;
        }

        $email = $email ?: $this->emailBawaan($nama, $nip);
        if (User::where('email', $email)->exists()) {
            $email = Str::before($email, '@') . '.' . Str::lower(Str::random(4)) . '@' . Str::after($email, '@');
        }

        User::create([
            'name' => $nama,
            'email' => $email,
            'password' => Hash::make($this->passwordBawaanImport()),
            'role' => 'dosen',
            'nip' => $nip,
            'status' => 'aktif',
        ]);
    }

    /**
     * Kata sandi untuk akun dosen yang baru dibuat lewat import.
     * Lihat config/sibau.php; bila dikosongkan, tiap akun mendapat kata sandi acak.
     */
    private function passwordBawaanImport(): string
    {
        return config('sibau.import_default_password') ?: Str::password(16);
    }

    private function emailBawaan(string $nama, string $nip): string
    {
        $depan = strtolower(preg_replace('/[^a-z]/i', '', explode(' ', trim($nama))[0] ?? '')) ?: 'dosen';

        return $depan . '.' . substr($nip, -4) . '@umi.ac.id';
    }

    /** Tambahkan kelas ke daftar_kelas prodi bila belum terdaftar. */
    private function daftarkanKelas(?string $kodeProdi, ?string $kelas): void
    {
        if (!$kodeProdi || !$kelas) {
            return;
        }

        $prodi = ProgramStudi::find($kodeProdi);
        if (!$prodi) {
            return;
        }

        $daftar = $prodi->daftar_kelas ?: [];
        if (!in_array($kelas, $daftar, true)) {
            $daftar[] = $kelas;
            $prodi->daftar_kelas = $daftar;
            $prodi->save();
        }
    }

    public function importJadwal(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
            'jenis_ujian' => 'required|in:UTS,UAS',
            'semester_aktif' => 'required|string',
            'tahun_akademik' => 'required|string',
        ]);

        try {
            $rows = $this->bacaBarisExcel($request);

            $dosenMap = Dosen::pluck('nip', 'nama')->toArray();
            $courseMap = MataKuliah::pluck('kode_mk', 'nama_mk')->toArray();
            $masuk = 0;
            $dilewati = [];

            DB::transaction(function () use ($rows, $request, &$dosenMap, &$courseMap, &$masuk, &$dilewati) {
                foreach ($rows as $idx => $row) {
                    // Template menaruh judul di baris 1-4 dan header di baris 5.
                    if ($idx < 6) {
                        continue;
                    }

                    $courseName = trim((string) ($row['E'] ?? ''));
                    $dosenName = trim((string) ($row['I'] ?? ''));
                    $sks = $row['F'] ?? null;
                    $kelas = trim((string) ($row['G'] ?? '')) ?: 'A';
                    $ruang = trim((string) ($row['C'] ?? '')) ?: null;

                    if ($courseName === '' || strcasecmp($courseName, 'Mata Kuliah') === 0) {
                        continue;
                    }

                    // Baris yang datanya tidak lengkap dilewati dengan alasan jelas,
                    // bukan dipaksakan memakai NIP/kode MK karangan.
                    if ($dosenName === '') {
                        $dilewati[] = "Baris {$idx}: nama dosen kosong.";
                        continue;
                    }
                    if ($ruang === null) {
                        $dilewati[] = "Baris {$idx}: ruang kosong.";
                        continue;
                    }

                    $tanggal = TanggalIndonesia::parse($row['A'] ?? null);
                    if (!$tanggal) {
                        $dilewati[] = "Baris {$idx}: tanggal '" . ($row['A'] ?? '') . "' tidak dapat dibaca.";
                        continue;
                    }

                    $jam = TanggalIndonesia::parseRentangJam($row['B'] ?? null);
                    if (!$jam) {
                        $dilewati[] = "Baris {$idx}: jam '" . ($row['B'] ?? '') . "' tidak dapat dibaca.";
                        continue;
                    }

                    $nip = $dosenMap[$dosenName] ?? null;
                    if (!$nip) {
                        $nip = $this->nipBaru($dosenMap);
                        $dosenMap[$dosenName] = $nip;
                        Dosen::create([
                            'nip' => $nip,
                            'nama' => $dosenName,
                            'kode_prodi' => null,
                            'jabatan' => null,
                            'status' => 'aktif',
                        ]);
                        $this->pastikanAkunDosen($nip, $dosenName);
                    }

                    $kodeMk = $courseMap[$courseName] ?? null;
                    if (!$kodeMk) {
                        $kodeMk = $this->kodeMataKuliahBaru($courseMap);
                        $courseMap[$courseName] = $kodeMk;
                        MataKuliah::create([
                            'kode_mk' => $kodeMk,
                            'nama_mk' => $courseName,
                            'sks' => is_numeric($sks) ? (int) $sks : 3,
                            'kode_prodi' => null,
                            'semester' => 1,
                            'status' => 'aktif',
                        ]);
                    }

                    JadwalUjian::create([
                        'kode_mk' => $kodeMk,
                        'nip_dosen' => $nip,
                        'tanggal' => $tanggal,
                        'sesi' => $request->jenis_ujian . ' Sesi',
                        'jam_mulai' => $jam[0],
                        'jam_selesai' => $jam[1],
                        'ruang' => $ruang,
                        'kelas' => $kelas,
                        'jenis_ujian' => $request->jenis_ujian,
                        'semester_aktif' => $request->semester_aktif,
                        'tahun_akademik' => $request->tahun_akademik,
                        'status' => 'terjadwal',
                    ]);

                    // Peserta ujian TIDAK diisi otomatis. Sebelumnya baris ini
                    // menempelkan 20-25 mahasiswa acak, yang menghasilkan berita
                    // acara berisi peserta palsu. Peserta dipilih admin lewat
                    // menu Jadwal > Edit > Pilih Peserta.
                    $this->daftarkanKelas(MataKuliah::find($kodeMk)?->kode_prodi, $kelas);

                    $masuk++;
                }
            });

            $hasil = $this->hasilImport($masuk, $dilewati, 'jadwal ujian');

            return $masuk > 0
                ? $hasil->with('info', 'Peserta ujian belum terisi. Buka menu Jadwal Ujian lalu pilih peserta untuk tiap jadwal.')
                : $hasil;
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengimpor jadwal: ' . $e->getMessage());
        }
    }

    /** NIP sementara untuk dosen yang belum ada di master data. */
    private function nipBaru(array $dosenMap): string
    {
        do {
            $nip = '19800' . str_pad((string) (count($dosenMap) + 1 + random_int(0, 999)), 6, '0', STR_PAD_LEFT);
        } while (in_array($nip, $dosenMap, true) || Dosen::whereKey($nip)->exists() || User::where('nip', $nip)->exists());

        return $nip;
    }

    /** Kode MK sementara untuk mata kuliah yang belum ada di master data. */
    private function kodeMataKuliahBaru(array $courseMap): string
    {
        $n = count($courseMap) + 1;
        do {
            $kode = 'MAK' . str_pad((string) $n, 3, '0', STR_PAD_LEFT);
            $n++;
        } while (in_array($kode, $courseMap, true) || MataKuliah::whereKey($kode)->exists());

        return $kode;
    }

    public function importDosen(Request $request)
    {
        $request->validate(['excel_file' => 'required|file|mimes:xlsx,xls']);

        try {
            $rows = $this->bacaBarisExcel($request);
            $masuk = 0;
            $dilewati = [];

            DB::transaction(function () use ($rows, &$masuk, &$dilewati) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) {
                        continue; // header
                    }

                    $nip = trim((string) ($row['A'] ?? ''));
                    $nama = trim((string) ($row['B'] ?? ''));

                    if ($nip === '' || $nama === '') {
                        continue;
                    }

                    $kodeProdi = trim((string) ($row['C'] ?? '')) ?: null;
                    if ($kodeProdi && !ProgramStudi::whereKey($kodeProdi)->exists()) {
                        $dilewati[] = "Baris {$idx}: kode prodi '{$kodeProdi}' tidak terdaftar.";
                        continue;
                    }

                    $jabatan = trim((string) ($row['D'] ?? '')) ?: null;
                    $email = trim((string) ($row['E'] ?? '')) ?: null;

                    $ampuMataKuliah = $this->pecahDaftar($row['F'] ?? '');
                    $ampuKelas = $this->pecahDaftar($row['G'] ?? '');

                    Dosen::updateOrCreate(['nip' => $nip], [
                        'nama' => $nama,
                        'kode_prodi' => $kodeProdi,
                        'jabatan' => $jabatan,
                        'status' => 'aktif',
                        'ampu_mata_kuliah' => $ampuMataKuliah,
                        'ampu_kelas' => $ampuKelas,
                    ]);

                    foreach ($ampuKelas as $kelas) {
                        $this->daftarkanKelas($kodeProdi, $kelas);
                    }

                    $this->pastikanAkunDosen($nip, $nama, $email);

                    $masuk++;
                }
            });

            return $this->hasilImport($masuk, $dilewati, 'data dosen');
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengimpor dosen: ' . $e->getMessage());
        }
    }

    /** @return array<int, string> */
    private function pecahDaftar(mixed $nilai): array
    {
        $teks = trim((string) $nilai);
        if ($teks === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $teks))));
    }

    public function importMahasiswa(Request $request)
    {
        $request->validate(['excel_file' => 'required|file|mimes:xlsx,xls']);

        try {
            $rows = $this->bacaBarisExcel($request);
            $masuk = 0;
            $dilewati = [];

            DB::transaction(function () use ($rows, &$masuk, &$dilewati) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) {
                        continue; // header
                    }

                    $nim = trim((string) ($row['A'] ?? ''));
                    $nama = trim((string) ($row['B'] ?? ''));

                    if ($nim === '' || $nama === '') {
                        continue;
                    }

                    $kodeProdi = trim((string) ($row['C'] ?? '')) ?: null;
                    if ($kodeProdi && !ProgramStudi::whereKey($kodeProdi)->exists()) {
                        $dilewati[] = "Baris {$idx}: kode prodi '{$kodeProdi}' tidak terdaftar.";
                        continue;
                    }

                    $angkatan = trim((string) ($row['D'] ?? '')) ?: date('Y');
                    $kelas = trim((string) ($row['E'] ?? '')) ?: 'A';

                    Mahasiswa::updateOrCreate(['nim' => $nim], [
                        'nama' => $nama,
                        'kode_prodi' => $kodeProdi,
                        'angkatan' => $angkatan,
                        'kelas' => $kelas,
                        'status' => 'aktif',
                    ]);

                    $this->daftarkanKelas($kodeProdi, $kelas);

                    $masuk++;
                }
            });

            return $this->hasilImport($masuk, $dilewati, 'data mahasiswa');
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengimpor mahasiswa: ' . $e->getMessage());
        }
    }

    public function importMataKuliah(Request $request)
    {
        $request->validate(['excel_file' => 'required|file|mimes:xlsx,xls']);

        try {
            $rows = $this->bacaBarisExcel($request);
            $masuk = 0;
            $dilewati = [];

            DB::transaction(function () use ($rows, &$masuk, &$dilewati) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) {
                        continue; // header
                    }

                    $kodeMk = trim((string) ($row['A'] ?? ''));
                    $namaMk = trim((string) ($row['B'] ?? ''));

                    if ($kodeMk === '' || $namaMk === '') {
                        continue;
                    }

                    $kodeProdi = trim((string) ($row['D'] ?? '')) ?: null;
                    if ($kodeProdi && !ProgramStudi::whereKey($kodeProdi)->exists()) {
                        $dilewati[] = "Baris {$idx}: kode prodi '{$kodeProdi}' tidak terdaftar.";
                        continue;
                    }

                    $sks = $row['C'] ?? null;
                    $semester = $row['E'] ?? null;

                    $teori = $this->bacaYaTidak($row['F'] ?? '', default: true);
                    $praktek = $this->bacaYaTidak($row['G'] ?? '', default: false);
                    if (!$teori && !$praktek) {
                        $teori = true;
                    }

                    MataKuliah::updateOrCreate(['kode_mk' => $kodeMk], [
                        'nama_mk' => $namaMk,
                        'sks' => is_numeric($sks) ? (int) $sks : 3,
                        'kode_prodi' => $kodeProdi,
                        'semester' => is_numeric($semester) ? (int) $semester : 1,
                        'teori' => $teori ? 1 : 0,
                        'praktek' => $praktek ? 1 : 0,
                        'status' => 'aktif',
                    ]);

                    $masuk++;
                }
            });

            return $this->hasilImport($masuk, $dilewati, 'data mata kuliah');
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengimpor mata kuliah: ' . $e->getMessage());
        }
    }

    private function bacaYaTidak(mixed $nilai, bool $default): bool
    {
        $teks = strtolower(trim((string) $nilai));

        if ($teks === '') {
            return $default;
        }

        return in_array($teks, ['y', 'ya', 'yes', '1', 'true'], true);
    }

    public function downloadTemplate($type)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $templates = [
            'dosen' => [
                'headers' => ['NIP', 'Nama Dosen', 'Kode Prodi', 'Jabatan Akademik', 'Email (Opsional)', 'Mata Kuliah Diampu (Kode MK, pisah koma)', 'Kelas Diampu (pisah koma)'],
                'sample' => ['19850312001', 'Dr. John Doe, M.Si.', 'AKT', 'Lektor', 'johndoe@umi.ac.id', 'MAK101,MAK102', 'A,B'],
                'filename' => 'template_import_dosen.xlsx',
            ],
            'mahasiswa' => [
                'headers' => ['NIM / NPM', 'Nama Mahasiswa', 'Kode Prodi', 'Angkatan', 'Kelas'],
                'sample' => ['2101010001', 'Jane Smith', 'MNJ', '2024', 'A'],
                'filename' => 'template_import_mahasiswa.xlsx',
            ],
            'matakuliah' => [
                'headers' => ['Kode MK', 'Nama Mata Kuliah', 'Jumlah SKS', 'Kode Prodi', 'Semester', 'Teori (Ya/Tidak)', 'Praktek (Ya/Tidak)'],
                'sample' => ['MAK101', 'Pengantar Akuntansi', '3', 'AKT', '1', 'Ya', 'Tidak'],
                'filename' => 'template_import_matakuliah.xlsx',
            ],
            'jadwal' => [
                'headers' => ['Hari/Tanggal', 'Jam', 'Ruang 1', 'Ruang 2', 'Mata Kuliah', 'SKS', 'Kls', 'Jml Mhs', 'Dosen'],
                'sample' => ['Senin, 08 Juni 2026', '08.30 - 10.00', 'R.301', '', 'Akuntansi Keuangan', '3', 'A', '35', 'Dr. John Doe, M.Si.'],
                'filename' => 'template_import_jadwal.xlsx',
            ],
        ];

        if (!isset($templates[$type])) {
            abort(404);
        }

        ['headers' => $headers, 'sample' => $sample, 'filename' => $filename] = $templates[$type];

        // Template jadwal memakai baris 1-4 sebagai judul, header di baris 5.
        $barisHeader = $type === 'jadwal' ? 5 : 1;

        if ($type === 'jadwal') {
            $sheet->setCellValue('A1', 'TEMPLATE IMPORT JADWAL UJIAN SIBAU');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->setCellValue('A2', 'Catatan: Baris 1-5 dilewati oleh sistem. Data diisi mulai baris ke-6.');
            $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10);
        }

        foreach ($headers as $colIdx => $header) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($col . $barisHeader, $header);
            $sheet->getStyle($col . $barisHeader)->getFont()->setBold(true);
            $sheet->setCellValue($col . ($barisHeader + 1), $sample[$colIdx] ?? '');
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return $this->unduhSpreadsheet($spreadsheet, $filename);
    }
}
