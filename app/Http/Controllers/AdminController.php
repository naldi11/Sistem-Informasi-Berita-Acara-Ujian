<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
use App\Models\PermohonanGantiPengawas;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminController extends Controller
{
    private function log($activity)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'aktivitas' => $activity,
        ]);
    }

    public function dashboard()
    {
        $totalJadwal = JadwalUjian::count();
        $pendingBAU = BeritaAcara::where('status_validasi', 'menunggu_validasi')->count();
        $validatedBAU = BeritaAcara::where('status_validasi', 'tervalidasi')->count();
        $draftBAU = BeritaAcara::where('status_validasi', 'draft')->count();
        $totalDosen = Dosen::where('status', 'aktif')->count();
        $totalMahasiswa = Mahasiswa::where('status', 'aktif')->count();

        $latestLogs = ActivityLog::with('user')->orderBy('created_at', 'desc')->limit(6)->get();

        $latestSchedules = JadwalUjian::with(['mataKuliah', 'dosen', 'beritaAcara'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('jam_mulai', 'desc')
            ->limit(5)
            ->get();

        $activeToday = JadwalUjian::with(['mataKuliah', 'dosen'])
            ->where(function ($query) {
                $query->where('tanggal', date('Y-m-d'))
                      ->orWhere('status', 'berlangsung');
            })
            ->orderBy('jam_mulai', 'asc')
            ->first();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_jadwal' => $totalJadwal,
                'pending_bau' => $pendingBAU,
                'validated_bau' => $validatedBAU,
                'draft_bau' => $draftBAU,
                'total_dosen' => $totalDosen,
                'total_mahasiswa' => $totalMahasiswa,
                'total_today' => JadwalUjian::where(function ($query) {
                    $query->where('tanggal', date('Y-m-d'))
                          ->orWhere('status', 'berlangsung');
                })->count(),
            ],
            'latestLogs' => $latestLogs,
            'latestSchedules' => $latestSchedules,
            'activeToday' => $activeToday,
        ]);
    }

    // --- CRUD Dosen & Mahasiswa ---
    public function usersIndex()
    {
        $dosens = Dosen::with(['programStudi', 'user'])->get();
        $mahasiswas = Mahasiswa::with('programStudi')->get();
        $prodis = ProgramStudi::where('status', 'aktif')->get();
        $courses = MataKuliah::where('status', 'aktif')->get();

        return Inertia::render('Admin/Users', [
            'dosens' => $dosens,
            'mahasiswas' => $mahasiswas,
            'prodis' => $prodis,
            'courses' => $courses,
        ]);
    }

    public function storeDosen(Request $request)
    {
        $request->validate([
            'nip' => 'required|string|unique:dosens,nip',
            'nama' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'kode_prodi' => 'nullable|string|exists:program_studis,kode_prodi',
            'jabatan' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            Dosen::create($request->only('nip', 'nama', 'kode_prodi', 'jabatan') + ['status' => 'aktif']);
            User::create([
                'name' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'dosen',
                'nip' => $request->nip,
                'status' => 'aktif',
            ]);
        });

        $this->log("Menambahkan pengawas baru: {$request->nama} ({$request->nip})");
        return redirect()->back()->with('success', 'Pengawas berhasil ditambahkan.');
    }

    public function updateDosen(Request $request, $nip)
    {
        $dosen = Dosen::findOrFail($nip);
        $user = User::where('nip', $dosen->nip)->first();
        $userId = $user ? $user->id : null;
        
        $request->validate([
            'nama' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $userId,
            'password' => 'nullable|string|min:6',
            'kode_prodi' => 'nullable|string|exists:program_studis,kode_prodi',
            'jabatan' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif',
        ]);

        DB::transaction(function () use ($request, $dosen, $user) {
            $dosen->update($request->only('nama', 'kode_prodi', 'jabatan', 'status'));
            
            // Sync user details
            if ($user) {
                $userData = [
                    'name' => $request->nama,
                    'email' => $request->email,
                    'status' => $request->status,
                ];
                if (!empty($request->password)) {
                    $userData['password'] = Hash::make($request->password);
                }
                $user->update($userData);
            }
        });

        $this->log("Mengubah data pengawas: {$request->nama} ({$nip})");
        return redirect()->back()->with('success', 'Data pengawas berhasil diubah.');
    }

    public function deleteDosen($nip)
    {
        $dosen = Dosen::findOrFail($nip);
        $name = $dosen->nama;

        if (JadwalUjian::where('nip_dosen', $nip)->exists()) {
            return redirect()->back()->with('error', 'Gagal menghapus: Pengawas ini memiliki jadwal pengawasan ujian yang aktif.');
        }

        DB::transaction(function () use ($dosen) {
            User::where('nip', $dosen->nip)->delete();
            $dosen->delete();
        });

        $this->log("Menghapus pengawas: {$name} ({$nip})");
        return redirect()->back()->with('success', 'Pengawas berhasil dihapus.');
    }

    public function storeMahasiswa(Request $request)
    {
        $request->validate([
            'nim' => 'required|string|unique:mahasiswas,nim',
            'nama' => 'required|string',
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'angkatan' => 'required|string',
            'kelas' => 'required|string',
            'email' => 'required|email|unique:mahasiswas,email',
            'password' => 'required|string|min:6',
        ]);

        Mahasiswa::create($request->only('nim', 'nama', 'kode_prodi', 'angkatan', 'kelas', 'email') + [
            'password' => Hash::make($request->password),
            'status' => 'aktif'
        ]);

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
            'email' => 'required|email|unique:mahasiswas,email,' . $nim . ',nim',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = $request->only('nama', 'kode_prodi', 'angkatan', 'kelas', 'status', 'email');
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $mahasiswa->update($updateData);

        $this->log("Mengubah data mahasiswa: {$request->nama} ({$nim})");
        return redirect()->back()->with('success', 'Data mahasiswa berhasil diubah.');
    }

    public function deleteMahasiswa($nim)
    {
        $mahasiswa = Mahasiswa::findOrFail($nim);
        $name = $mahasiswa->nama;

        if (PesertaUjian::where('nim', $nim)->exists()) {
            return redirect()->back()->with('error', 'Gagal menghapus: Mahasiswa ini sudah terdaftar sebagai peserta ujian.');
        }

        $mahasiswa->delete();

        $this->log("Menghapus mahasiswa: {$name} ({$nim})");
        return redirect()->back()->with('success', 'Mahasiswa berhasil dihapus.');
    }

    // --- CRUD Program Studi ---
    public function prodiIndex()
    {
        // Get list of prodis with total courses and students
        $prodis = ProgramStudi::all()->map(function ($prodi) {
            return [
                'kode_prodi' => $prodi->kode_prodi,
                'nama_prodi' => $prodi->nama_prodi,
                'fakultas' => $prodi->fakultas,
                'status' => $prodi->status,
                'daftar_kelas' => $prodi->daftar_kelas ?: [],
                'total_mk' => MataKuliah::where('kode_prodi', $prodi->kode_prodi)->count(),
                'total_mahasiswa' => Mahasiswa::where('kode_prodi', $prodi->kode_prodi)->where('status', 'aktif')->count(),
            ];
        });

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
        $name = $prodi->nama_prodi;

        if (Mahasiswa::where('kode_prodi', $kode_prodi)->exists() || Dosen::where('kode_prodi', $kode_prodi)->exists() || MataKuliah::where('kode_prodi', $kode_prodi)->exists()) {
            return redirect()->back()->with('error', 'Gagal menghapus: Program studi ini memiliki dosen, mahasiswa, atau mata kuliah terdaftar.');
        }

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
        $courses = MataKuliah::with(['programStudi', 'dosenPengampu'])->get();
        $prodis = ProgramStudi::where('status', 'aktif')->get();
        $dosens = Dosen::where('status', 'aktif')->select('nip', 'nama')->get();

        return Inertia::render('MataKuliah/Index', [
            'courses' => $courses,
            'prodis' => $prodis,
            'dosens' => $dosens,
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
            'nip_dosen' => 'nullable|string|exists:dosens,nip',
        ]);

        MataKuliah::create($request->only('kode_mk', 'nama_mk', 'sks', 'kode_prodi', 'semester', 'nip_dosen') + [
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
            'nip_dosen' => 'nullable|string|exists:dosens,nip',
        ]);

        $course->update($request->only('nama_mk', 'sks', 'kode_prodi', 'semester', 'status', 'nip_dosen'));

        $this->log("Mengubah mata kuliah: {$request->nama_mk} ({$kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil diubah.');
    }

    public function deleteMataKuliah($kode_mk)
    {
        $course = MataKuliah::findOrFail($kode_mk);
        $name = $course->nama_mk;

        if (JadwalUjian::where('kode_mk', $kode_mk)->exists()) {
            return redirect()->back()->with('error', 'Gagal menghapus: Mata kuliah ini memiliki jadwal ujian yang aktif.');
        }

        $course->delete();

        $this->log("Menghapus mata kuliah: {$name} ({$kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil dihapus.');
    }

    // --- CRUD Jadwal Ujian ---
    public function jadwalIndex()
    {
        $schedules = JadwalUjian::with([
            'mataKuliah.dosenPengampu',
            'dosen',
            'pesertaUjians' => function ($q) {
                $q->select('id', 'jadwal_ujian_id', 'nim');
            },
            'beritaAcara'
        ])->get();

        $dosens = Dosen::where('status', 'aktif')
            ->select('nip', 'nama')
            ->get();

        $courses = MataKuliah::where('status', 'aktif')
            ->select('kode_mk', 'nama_mk', 'semester', 'kode_prodi')
            ->get();

        $mahasiswas = Mahasiswa::where('status', 'aktif')
            ->select('nim', 'nama', 'kelas', 'kode_prodi')
            ->get();

        $prodis = ProgramStudi::where('status', 'aktif')
            ->select('kode_prodi', 'nama_prodi')
            ->get();

        return Inertia::render('Jadwal/Index', [
            'schedules' => $schedules,
            'dosens' => $dosens,
            'courses' => $courses,
            'mahasiswas' => $mahasiswas,
            'prodis' => $prodis,
        ]);
    }

    public function storeJadwal(Request $request)
    {
        $request->validate([
            'kode_mk' => 'required|string|exists:mata_kuliahs,kode_mk',
            'nip_dosen' => 'required|string|exists:dosens,nip',
            'tanggal' => 'required|date',
            'sesi' => 'nullable|string',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required',
            'ruang' => 'required|string',
            'kelas' => 'required|string',
            'jenis_ujian' => 'required|in:UTS,UAS',
            'semester_aktif' => 'required|string',
            'tahun_akademik' => 'required|string',
            'student_nims' => 'required|array',
        ]);

        $kode_mk = $request->kode_mk;
        $nip_dosen = $request->nip_dosen;
        $tanggal = $request->tanggal;
        $jam_mulai = $request->jam_mulai;
        $jam_selesai = $request->jam_selesai;
        $ruang = $request->ruang;
        $student_nims = $request->student_nims;

        $mataKuliah = MataKuliah::findOrFail($kode_mk);
        $isPraktek = \Illuminate\Support\Str::contains(strtolower($mataKuliah->nama_mk), ['praktek', 'praktikum', 'prak']);

        // D. Supervisor must NOT be the course lecturer
        if ($mataKuliah->nip_dosen === $nip_dosen) {
            return back()->withErrors(['nip_dosen' => "Dosen Pengampu tidak boleh mengawas ujian mata kuliah yang diampunya sendiri."]);
        }

        if (strtotime($jam_mulai) >= strtotime($jam_selesai)) {
            return back()->withErrors(['jam_selesai' => "Jam selesai harus lebih akhir dari jam mulai."]);
        }

        $semester_aktif = $request->semester_aktif;
        $isSemGanjil = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'ganjil');
        $isSemGenap = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'genap');

        if ($isSemGanjil && $mataKuliah->semester % 2 === 0) {
            return back()->withErrors(['kode_mk' => "Mata kuliah {$mataKuliah->nama_mk} (Semester {$mataKuliah->semester}) tidak dapat dijadwalkan pada semester aktif Ganjil."]);
        }
        if ($isSemGenap && $mataKuliah->semester % 2 !== 0) {
            return back()->withErrors(['kode_mk' => "Mata kuliah {$mataKuliah->nama_mk} (Semester {$mataKuliah->semester}) tidak dapat dijadwalkan pada semester aktif Genap."]);
        }

        // 1. Check Room Conflict
        $roomConflict = JadwalUjian::where('tanggal', $tanggal)
            ->where('ruang', $ruang)
            ->where('kode_mk', '!=', $kode_mk)
            ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                $query->where('jam_mulai', '<', $jam_selesai)
                      ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with('mataKuliah')
            ->first();

        if ($roomConflict) {
            return back()->withErrors(['ruang' => "Jadwal tabrakan: Ruang {$ruang} sudah digunakan oleh mata kuliah {$roomConflict->mataKuliah->nama_mk} pada jam ini."]);
        }

        // 2. Check Lecturer Conflict
        $lecturerConflict = JadwalUjian::where('tanggal', $tanggal)
            ->where('nip_dosen', $nip_dosen)
            ->where('kode_mk', '!=', $kode_mk)
            ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                $query->where('jam_mulai', '<', $jam_selesai)
                      ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with(['dosen', 'mataKuliah'])
            ->first();

        if ($lecturerConflict) {
            return back()->withErrors(['nip_dosen' => "Jadwal tabrakan: Pengawas {$lecturerConflict->dosen->nama} sudah menjadwalkan pengawasan lain ({$lecturerConflict->mataKuliah->nama_mk}) pada jam ini."]);
        }

        // 3. Check Student Conflict
        $studentConflict = PesertaUjian::whereIn('nim', $student_nims)
            ->whereHas('jadwalUjian', function ($query) use ($tanggal, $jam_mulai, $jam_selesai) {
                $query->where('tanggal', $tanggal)
                    ->where('jam_mulai', '<', $jam_selesai)
                    ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with(['mahasiswa', 'jadwalUjian.mataKuliah'])
            ->first();

        if ($studentConflict) {
            return back()->withErrors([
                'student_nims' => "Jadwal tabrakan: Mahasiswa {$studentConflict->mahasiswa->nama} ({$studentConflict->nim}) sudah terdaftar di ujian {$studentConflict->jadwalUjian->mataKuliah->nama_mk} pada jam ini."
            ]);
        }

        DB::transaction(function () use ($request) {
            $jadwal = JadwalUjian::create($request->only(
                'kode_mk', 'nip_dosen', 'tanggal', 'sesi', 'jam_mulai', 'jam_selesai',
                'ruang', 'kelas', 'jenis_ujian', 'semester_aktif', 'tahun_akademik'
            ) + [
                'status' => 'terjadwal',
                'token' => strtoupper(\Illuminate\Support\Str::random(6)),
            ]);

            foreach ($request->student_nims as $nim) {
                PesertaUjian::create([
                    'jadwal_ujian_id' => $jadwal->id,
                    'nim' => $nim,
                    'kehadiran' => 'belum_ditentukan',
                ]);
            }
        });

        $this->log("Membuat jadwal ujian baru ID #{$request->kode_mk} Kelas {$request->kelas}");
        return redirect()->back()->with('success', 'Jadwal ujian berhasil ditambahkan.');
    }

    public function updateJadwal(Request $request, $id)
    {
        $jadwal = JadwalUjian::findOrFail($id);

        $request->validate([
            'kode_mk' => 'required|string|exists:mata_kuliahs,kode_mk',
            'nip_dosen' => 'required|string|exists:dosens,nip',
            'tanggal' => 'required|date',
            'sesi' => 'nullable|string',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required',
            'ruang' => 'required|string',
            'kelas' => 'required|string',
            'jenis_ujian' => 'required|in:UTS,UAS',
            'semester_aktif' => 'required|string',
            'tahun_akademik' => 'required|string',
            'status' => 'required|in:terjadwal,berlangsung,selesai,dibatalkan',
            'student_nims' => 'required|array',
        ]);

        $kode_mk = $request->kode_mk;
        $nip_dosen = $request->nip_dosen;
        $tanggal = $request->tanggal;
        $jam_mulai = $request->jam_mulai;
        $jam_selesai = $request->jam_selesai;
        $ruang = $request->ruang;
        $student_nims = $request->student_nims;

        $mataKuliah = MataKuliah::findOrFail($kode_mk);
        $isPraktek = \Illuminate\Support\Str::contains(strtolower($mataKuliah->nama_mk), ['praktek', 'praktikum', 'prak']);

        // D. Supervisor must NOT be the course lecturer
        if ($mataKuliah->nip_dosen === $nip_dosen) {
            return back()->withErrors(['nip_dosen' => "Dosen Pengampu tidak boleh mengawas ujian mata kuliah yang diampunya sendiri."]);
        }

        if (strtotime($jam_mulai) >= strtotime($jam_selesai)) {
            return back()->withErrors(['jam_selesai' => "Jam selesai harus lebih akhir dari jam mulai."]);
        }

        $semester_aktif = $request->semester_aktif;
        $isSemGanjil = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'ganjil');
        $isSemGenap = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'genap');

        if ($isSemGanjil && $mataKuliah->semester % 2 === 0) {
            return back()->withErrors(['kode_mk' => "Mata kuliah {$mataKuliah->nama_mk} (Semester {$mataKuliah->semester}) tidak dapat dijadwalkan pada semester aktif Ganjil."]);
        }
        if ($isSemGenap && $mataKuliah->semester % 2 !== 0) {
            return back()->withErrors(['kode_mk' => "Mata kuliah {$mataKuliah->nama_mk} (Semester {$mataKuliah->semester}) tidak dapat dijadwalkan pada semester aktif Genap."]);
        }

        // 1. Check Room Conflict
        $roomConflict = JadwalUjian::where('tanggal', $tanggal)
            ->where('id', '!=', $id)
            ->where('ruang', $ruang)
            ->where('kode_mk', '!=', $kode_mk)
            ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                $query->where('jam_mulai', '<', $jam_selesai)
                      ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with('mataKuliah')
            ->first();

        if ($roomConflict) {
            return back()->withErrors(['ruang' => "Jadwal tabrakan: Ruang {$ruang} sudah digunakan oleh mata kuliah {$roomConflict->mataKuliah->nama_mk} pada jam ini."]);
        }

        // 2. Check Lecturer Conflict
        $lecturerConflict = JadwalUjian::where('tanggal', $tanggal)
            ->where('id', '!=', $id)
            ->where('nip_dosen', $nip_dosen)
            ->where('kode_mk', '!=', $kode_mk)
            ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                $query->where('jam_mulai', '<', $jam_selesai)
                      ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with(['dosen', 'mataKuliah'])
            ->first();

        if ($lecturerConflict) {
            return back()->withErrors(['nip_dosen' => "Jadwal tabrakan: Pengawas {$lecturerConflict->dosen->nama} sudah menjadwalkan pengawasan lain ({$lecturerConflict->mataKuliah->nama_mk}) pada jam ini."]);
        }

        // 3. Check Student Conflict
        $studentConflict = PesertaUjian::whereIn('nim', $student_nims)
            ->whereHas('jadwalUjian', function ($query) use ($id, $tanggal, $jam_mulai, $jam_selesai) {
                $query->where('id', '!=', $id)
                    ->where('tanggal', $tanggal)
                    ->where('jam_mulai', '<', $jam_selesai)
                    ->where('jam_selesai', '>', $jam_mulai);
            })
            ->with(['mahasiswa', 'jadwalUjian.mataKuliah'])
            ->first();

        if ($studentConflict) {
            return back()->withErrors([
                'student_nims' => "Jadwal tabrakan: Mahasiswa {$studentConflict->mahasiswa->nama} ({$studentConflict->nim}) sudah terdaftar di ujian {$studentConflict->jadwalUjian->mataKuliah->nama_mk} pada jam ini."
            ]);
        }

        DB::transaction(function () use ($request, $jadwal) {
            $jadwal->update($request->only(
                'kode_mk', 'nip_dosen', 'tanggal', 'sesi', 'jam_mulai', 'jam_selesai',
                'ruang', 'kelas', 'jenis_ujian', 'semester_aktif', 'tahun_akademik', 'status'
            ));

            // Sync students
            PesertaUjian::where('jadwal_ujian_id', $jadwal->id)->delete();
            foreach ($request->student_nims as $nim) {
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
        $jadwal = JadwalUjian::findOrFail($id);
        $jadwal->delete();

        $this->log("Menghapus jadwal ujian ID #{$id}");
        return redirect()->back()->with('success', 'Jadwal ujian berhasil dihapus.');
    }

    // --- Berita Acara (BAU) List & Validation ---
    // --- Permohonan Penggantian Pengawas ---
    public function permohonanPenggantianIndex()
    {
        $permohonan = PermohonanGantiPengawas::with(['jadwalUjian.mataKuliah', 'pemohon', 'pengganti'])
            ->orderBy('created_at', 'desc')
            ->get();

        $dosens = Dosen::where('status', 'aktif')->select('nip', 'nama')->get();

        return Inertia::render('Admin/PermohonanPenggantian', [
            'permohonan' => $permohonan,
            'dosens' => $dosens,
        ]);
    }

    public function approvePermohonanPenggantian(Request $request, $id)
    {
        $request->validate([
            'dosen_pengganti_nip' => 'required|exists:dosens,nip',
        ]);

        $permohonan = PermohonanGantiPengawas::findOrFail($id);

        if ($permohonan->status !== 'pending') {
            return back()->withErrors(['error' => 'Permohonan ini sudah diproses sebelumnya.']);
        }

        DB::transaction(function () use ($request, $permohonan) {
            $permohonan->update([
                'status' => 'disetujui',
                'dosen_pengganti_nip' => $request->dosen_pengganti_nip,
            ]);

            $permohonan->jadwalUjian->update([
                'nip_dosen' => $request->dosen_pengganti_nip,
            ]);
        });

        $this->log("Menyetujui permohonan penggantian pengawas (ID: {$id}) dan menugaskan Dosen {$request->dosen_pengganti_nip}");

        return redirect()->back()->with('success', 'Permohonan disetujui. Pengawas jadwal ujian telah diganti.');
    }

    public function rejectPermohonanPenggantian($id)
    {
        $permohonan = PermohonanGantiPengawas::findOrFail($id);

        if ($permohonan->status !== 'pending') {
            return back()->withErrors(['error' => 'Permohonan ini sudah diproses sebelumnya.']);
        }

        $permohonan->update([
            'status' => 'ditolak',
        ]);

        $this->log("Menolak permohonan penggantian pengawas (ID: {$id})");

        return redirect()->back()->with('success', 'Permohonan telah ditolak.');
    }

    public function cetakSuratPermohonan($id)
    {
        $permohonan = PermohonanGantiPengawas::with(['jadwalUjian.mataKuliah.dosenPengampu', 'pemohon', 'pengganti', 'jadwalUjian.mataKuliah.programStudi'])
            ->findOrFail($id);

        $days = ['Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu'];
        $months = ['01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April', '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus', '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'];

        $dt = new \DateTime($permohonan->created_at);
        $dayName = $days[$dt->format('l')];
        $dayNum = $dt->format('d');
        $monthName = $months[$dt->format('m')];
        $year = $dt->format('Y');

        $dtUjian = new \DateTime($permohonan->jadwalUjian->tanggal);
        $ujianDayName = $days[$dtUjian->format('l')];

        $pdf = Pdf::loadView('pdf.surat_permohonan_penggantian', [
            'permohonan' => $permohonan,
            'dayName' => $dayName,
            'dayNum' => $dayNum,
            'monthName' => $monthName,
            'year' => $year,
            'ujianDayName' => $ujianDayName,
        ]);

        return $pdf->stream("Surat_Permohonan_Penggantian_Jadwal_{$permohonan->pemohon->nama}.pdf");
    }

    public function beritaAcaraIndex()
    {
        $baus = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen'])->get();
        $dosens = Dosen::where('status', 'aktif')->select('nip', 'nama')->get();

        return Inertia::render('Admin/BeritaAcara', [
            'baus' => $baus,
            'dosens' => $dosens,
        ]);
    }

    public function validateBeritaAcara(Request $request, $id)
    {
        $request->validate([
            'status_validasi' => 'required|in:tervalidasi,draft,menunggu_validasi',
        ]);

        $bau = BeritaAcara::findOrFail($id);
        $bau->update([
            'status_validasi' => $request->status_validasi,
        ]);

        // If validated, update schedule status to 'selesai'
        if ($request->status_validasi === 'tervalidasi') {
            $bau->jadwalUjian->update([
                'status' => 'selesai',
            ]);
        }

        $this->log("Memvalidasi berita acara ujian ID #{$id} menjadi: {$request->status_validasi}");
        return redirect()->back()->with('success', 'Status validasi BERITA UJIAN berhasil diperbarui.');
    }

    public function printBeritaAcaraPdf($id)
    {
        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah.dosenPengampu', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
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

    // --- Laporan & Rekapitulasi ---
    public function laporanIndex(Request $request)
    {
        $query = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen']);

        if ($request->start_date && $request->end_date) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->whereBetween('tanggal', [$request->start_date, $request->end_date]);
            });
        }

        if ($request->kode_mk) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('kode_mk', $request->kode_mk);
            });
        }

        if ($request->nip_dosen) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('nip_dosen', $request->nip_dosen);
            });
        }

        if ($request->semester_aktif) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('semester_aktif', $request->semester_aktif);
            });
        }

        $baus = $query->get();
        $courses = MataKuliah::all();
        $dosens = Dosen::all();

        return Inertia::render('Admin/Laporan', [
            'baus' => $baus,
            'courses' => $courses,
            'dosens' => $dosens,
            'filters' => $request->only('start_date', 'end_date', 'kode_mk', 'nip_dosen', 'semester_aktif'),
        ]);
    }

    public function exportLaporanPdf(Request $request)
    {
        $query = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen']);

        if ($request->start_date && $request->end_date) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->whereBetween('tanggal', [$request->start_date, $request->end_date]);
            });
        }

        if ($request->kode_mk) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('kode_mk', $request->kode_mk);
            });
        }

        if ($request->nip_dosen) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('nip_dosen', $request->nip_dosen);
            });
        }

        if ($request->semester_aktif) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('semester_aktif', $request->semester_aktif);
            });
        }

        $baus = $query->get();

        $pdf = Pdf::loadView('pdf.rekap_laporan', [
            'baus' => $baus,
            'filters' => $request->only('start_date', 'end_date', 'kode_mk', 'nip_dosen', 'semester_aktif'),
        ]);

        return $pdf->download('rekap_laporan_bau.pdf');
    }

    public function exportLaporanExcel(Request $request)
    {
        $query = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen']);

        if ($request->start_date && $request->end_date) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->whereBetween('tanggal', [$request->start_date, $request->end_date]);
            });
        }

        if ($request->kode_mk) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('kode_mk', $request->kode_mk);
            });
        }

        if ($request->nip_dosen) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('nip_dosen', $request->nip_dosen);
            });
        }

        if ($request->semester_aktif) {
            $query->whereHas('jadwalUjian', function ($q) use ($request) {
                $q->where('semester_aktif', $request->semester_aktif);
            });
        }

        $baus = $query->get();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Title
        $sheet->setCellValue('A1', 'LAPORAN REKAPITULASI BERITA ACARA UJIAN (BAU)');
        $sheet->mergeCells('A1:J1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        
        $sheet->setCellValue('A2', 'FAKULTAS EKONOMI - UNIVERSITAS METHODIST INDONESIA');
        $sheet->mergeCells('A2:J2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        
        // Subtitle/Filters
        $periodText = ($request->start_date && $request->end_date) ? "Periode: {$request->start_date} s/d {$request->end_date}" : "Periode: Semua";
        $sheet->setCellValue('A3', $periodText);
        $sheet->mergeCells('A3:J3');
        $sheet->getStyle('A3')->getFont()->setItalic(true);

        // Headers
        $headers = ['No', 'Kode MK', 'Nama Mata Kuliah', 'Pengawas', 'Tanggal', 'Kelas', 'Token', 'Hadir', 'Absen', 'Status Validasi'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        foreach ($headers as $colIdx => $header) {
            $sheet->setCellValue($cols[$colIdx] . '5', $header);
            $sheet->getStyle($cols[$colIdx] . '5')->getFont()->setBold(true);
            $sheet->getStyle($cols[$colIdx] . '5')->getBorders()->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        }

        $rowIdx = 6;
        foreach ($baus as $idx => $b) {
            $sheet->setCellValue('A' . $rowIdx, $idx + 1);
            $sheet->setCellValue('B' . $rowIdx, $b->jadwalUjian->kode_mk);
            $sheet->setCellValue('C' . $rowIdx, $b->jadwalUjian->mataKuliah->nama_mk);
            $sheet->setCellValue('D' . $rowIdx, $b->jadwalUjian->dosen->nama);
            $sheet->setCellValue('E' . $rowIdx, $b->jadwalUjian->tanggal);
            $sheet->setCellValue('F' . $rowIdx, $b->jadwalUjian->kelas);
            $sheet->setCellValue('G' . $rowIdx, $b->jadwalUjian->token);
            $sheet->setCellValue('H' . $rowIdx, $b->jumlah_hadir);
            $sheet->setCellValue('I' . $rowIdx, $b->jumlah_absen);
            $sheet->setCellValue('J' . $rowIdx, $b->status_validasi === 'tervalidasi' ? 'Valid' : 'Pending');
            $rowIdx++;
        }

        // Auto size columns
        foreach ($cols as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="rekap_laporan_bau.xlsx"');
        header('Cache-Control: max-age=0');
        
        $writer->save('php://output');
        exit;
    }

    // --- Pengaturan / Settings ---
    public function pengaturanIndex()
    {
        $users = User::all();
        $securitySettings = [
            'attendance_token_enabled' => \App\Models\Setting::getValue('attendance_token_enabled', true),
            'attendance_gps_enabled'   => \App\Models\Setting::getValue('attendance_gps_enabled', false),
            'attendance_ip_enabled'    => \App\Models\Setting::getValue('attendance_ip_enabled', false),
            'campus_latitude'          => \App\Models\Setting::getValue('campus_latitude', -5.1476),
            'campus_longitude'         => \App\Models\Setting::getValue('campus_longitude', 119.4328),
            'campus_radius'            => \App\Models\Setting::getValue('campus_radius', 100),
            'campus_ip_whitelist'      => \App\Models\Setting::getValue('campus_ip_whitelist', '127.0.0.1, 192.168.1.0/24'),
        ];

        return Inertia::render('Admin/Pengaturan', [
            'users' => $users,
            'securitySettings' => $securitySettings,
        ]);
    }

    public function updateSecuritySettings(Request $request)
    {
        $request->validate([
            'attendance_token_enabled' => 'required|boolean',
            'attendance_gps_enabled'   => 'required|boolean',
            'attendance_ip_enabled'    => 'required|boolean',
            'campus_latitude'          => 'required|numeric',
            'campus_longitude'         => 'required|numeric',
            'campus_radius'            => 'required|integer|min:5',
            'campus_ip_whitelist'      => 'nullable|string',
        ]);

        \App\Models\Setting::setValue('attendance_token_enabled', $request->attendance_token_enabled);
        \App\Models\Setting::setValue('attendance_gps_enabled', $request->attendance_gps_enabled);
        \App\Models\Setting::setValue('attendance_ip_enabled', $request->attendance_ip_enabled);
        \App\Models\Setting::setValue('campus_latitude', $request->campus_latitude);
        \App\Models\Setting::setValue('campus_longitude', $request->campus_longitude);
        \App\Models\Setting::setValue('campus_radius', $request->campus_radius);
        \App\Models\Setting::setValue('campus_ip_whitelist', $request->campus_ip_whitelist ?: '');

        $this->log("Memperbarui konfigurasi keamanan absensi ujian mahasiswa");
        return redirect()->back()->with('success', 'Pengaturan keamanan absensi berhasil diperbarui.');
    }

    public function panduanIndex()
    {
        return Inertia::render('Admin/Panduan');
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        if ($request->password) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        $this->log("Mengubah profil admin sendiri");
        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function addStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:admin,dosen',
            'nip' => 'nullable|string',
            'password' => 'required|string|min:6',
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



    public function importDosen(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            $file = $request->file('excel_file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $importCount = 0;

            DB::transaction(function () use ($rows, &$importCount) {
                // Default column map in case headers are missing or not matching
                $colMap = [
                    'nip' => 'A',
                    'nama' => 'B',
                    'jabatan' => 'C',
                    'email' => 'D',
                    'ampu_mk' => 'E',
                    'ampu_kelas' => 'F',
                ];

                // Detect headers from row 1
                if (isset($rows[1])) {
                    foreach ($rows[1] as $colLetter => $cellVal) {
                        if ($cellVal === null) continue;
                        $cellValClean = strtolower(trim($cellVal));
                        if (str_contains($cellValClean, 'nip') || str_contains($cellValClean, 'nidn')) {
                            $colMap['nip'] = $colLetter;
                        } elseif (str_contains($cellValClean, 'nama') || str_contains($cellValClean, 'name')) {
                            $colMap['nama'] = $colLetter;
                        } elseif (str_contains($cellValClean, 'email')) {
                            $colMap['email'] = $colLetter;
                        } elseif (str_contains($cellValClean, 'jabatan')) {
                            $colMap['jabatan'] = $colLetter;
                        } elseif (str_contains($cellValClean, 'kelas') || $cellValClean === 'kls') {
                            $colMap['ampu_kelas'] = $colLetter;
                        } elseif (str_contains($cellValClean, 'mata kuliah') || str_contains($cellValClean, 'diampu') || $cellValClean === 'mk') {
                            $colMap['ampu_mk'] = $colLetter;
                        }
                    }
                }

                foreach ($rows as $idx => $row) {
                    if ($idx === 1) continue; // Skip header
                    $nip = trim($row[$colMap['nip']] ?? '');
                    $nama = trim($row[$colMap['nama']] ?? '');
                    $kode_prodi = null; // No longer has prodi for pengawas
                    $jabatan = trim($row[$colMap['jabatan']] ?? 'Lektor');
                    $email = trim($row[$colMap['email']] ?? '');
                    
                    $ampu_mata_kuliah_str = trim($row[$colMap['ampu_mk']] ?? '');
                    $ampu_kelas_str = trim($row[$colMap['ampu_kelas']] ?? '');

                    $ampu_mata_kuliah = !empty($ampu_mata_kuliah_str) 
                        ? array_map(function ($mk) { return strtoupper(trim($mk)); }, explode(',', $ampu_mata_kuliah_str)) 
                        : [];
                    $ampu_kelas = !empty($ampu_kelas_str) 
                        ? array_map(function ($k) { return strtoupper(trim($k)); }, explode(',', $ampu_kelas_str)) 
                        : [];

                    if (empty($nip) || empty($nama)) continue;

                    Dosen::updateOrCreate([
                        'nip' => $nip,
                    ], [
                        'nama' => $nama,
                        'kode_prodi' => $kode_prodi,
                        'jabatan' => $jabatan,
                        'status' => 'aktif',
                    ]);

                    if (empty($email)) {
                        $emailName = strtolower(preg_replace('/[^a-z]/', '', explode(' ', $nama)[0] ?? 'dosen'));
                        $email = $emailName . '.' . substr($nip, -4) . '@umi.ac.id';
                    }

                    User::updateOrCreate([
                        'nip' => $nip,
                    ], [
                        'name' => $nama,
                        'email' => $email,
                        'password' => Hash::make('password'),
                        'role' => 'dosen',
                        'status' => 'aktif',
                    ]);

                    $importCount++;
                }
            });

            if ($importCount === 0) {
                return redirect()->back()->with('error', "Gagal mengimpor data. Berkas tidak memiliki data dosen yang valid atau format kolom salah.");
            }

            $this->log("Mengimpor {$importCount} data dosen baru dari Excel");
            return redirect()->back()->with('success', "Berhasil mengimpor {$importCount} data dosen.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Terjadi kesalahan saat mengimpor dosen: " . $e->getMessage());
        }
    }

    public function importMahasiswa(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            $file = $request->file('excel_file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $importCount = 0;

            // Pre-compute the default password hash once to prevent execution timeouts (Bcrypt is heavy CPU work)
            $defaultPasswordHash = \Illuminate\Support\Facades\Hash::make('password');

            DB::transaction(function () use ($rows, &$importCount, $defaultPasswordHash) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) continue; // Skip header

                    $nim = trim($row['A'] ?? '');
                    $nama = trim($row['B'] ?? '');
                    $kode_prodi = strtoupper(trim($row['C'] ?? 'AKT'));
                    $angkatan = trim($row['D'] ?? '');
                    $kelas = strtoupper(trim($row['E'] ?? 'A'));
                    $email = trim($row['F'] ?? '');
                    $password = trim($row['G'] ?? '');

                    if (empty($nim) || empty($nama)) continue;

                    if (empty($angkatan)) {
                        $angkatan = date('Y');
                    }

                    if (empty($email)) {
                        $email = $nim . '@student.umi.ac.id';
                    }

                    // Reuse the precomputed hash if the password is empty or equal to 'password'
                    $hashedPassword = $defaultPasswordHash;
                    if (!empty($password) && $password !== 'password') {
                        $hashedPassword = \Illuminate\Support\Facades\Hash::make($password);
                    }

                    if (!ProgramStudi::where('kode_prodi', $kode_prodi)->exists()) {
                        $firstProdi = ProgramStudi::first();
                        if ($firstProdi) {
                            $kode_prodi = $firstProdi->kode_prodi;
                        } else {
                            $kode_prodi = 'AKT';
                            ProgramStudi::create([
                                'kode_prodi' => 'AKT',
                                'nama_prodi' => 'Akuntansi',
                                'status' => 'aktif',
                            ]);
                        }
                    }

                    $mahasiswaData = [
                        'nama' => $nama,
                        'email' => $email,
                        'kode_prodi' => $kode_prodi,
                        'angkatan' => $angkatan,
                        'kelas' => $kelas ?: 'A',
                        'status' => 'aktif',
                    ];

                    $existing = Mahasiswa::where('nim', $nim)->first();
                    if (!$existing) {
                        $mahasiswaData['password'] = $hashedPassword;
                    } elseif (!empty(trim($row['G'] ?? ''))) {
                        $mahasiswaData['password'] = $hashedPassword;
                    }

                    Mahasiswa::updateOrCreate([
                        'nim' => $nim,
                    ], $mahasiswaData);

                    // Automatically add classes to the Mahasiswa's program studi if not exists
                    $prodi = ProgramStudi::where('kode_prodi', $kode_prodi)->first();
                    if ($prodi) {
                        $kelasVal = $kelas ?: 'A';
                        $daftar = $prodi->daftar_kelas ?: [];
                        if (!in_array($kelasVal, $daftar)) {
                            $daftar[] = $kelasVal;
                            $prodi->daftar_kelas = $daftar;
                            $prodi->save();
                        }
                    }

                    $importCount++;
                }
            });

            if ($importCount === 0) {
                return redirect()->back()->with('error', "Gagal mengimpor data. Berkas tidak memiliki data mahasiswa yang valid atau format kolom salah.");
            }

            $this->log("Mengimpor {$importCount} data mahasiswa baru dari Excel");
            return redirect()->back()->with('success', "Berhasil mengimpor {$importCount} data mahasiswa.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Terjadi kesalahan saat mengimpor mahasiswa: " . $e->getMessage());
        }
    }

    public function importMataKuliah(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            $file = $request->file('excel_file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $importCount = 0;

            DB::transaction(function () use ($rows, &$importCount) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) continue; // Skip header

                    $kode_mk = strtoupper(trim($row['A'] ?? ''));
                    $nama_mk = trim($row['B'] ?? '');
                    $sks = trim($row['C'] ?? '3');
                    $kode_prodi = strtoupper(trim($row['D'] ?? 'AKT'));
                    $semester = trim($row['E'] ?? '1');
                    $nip_dosen = trim($row['F'] ?? '');

                    if (empty($kode_mk) || empty($nama_mk)) continue;

                    if (!is_numeric($sks)) $sks = 3;
                    if (!is_numeric($semester)) $semester = 1;

                    if (!empty($nip_dosen) && Dosen::where('nip', $nip_dosen)->exists()) {
                        // NIP exists in database
                    } else {
                        $nip_dosen = null;
                    }

                    if (!ProgramStudi::where('kode_prodi', $kode_prodi)->exists()) {
                        $firstProdi = ProgramStudi::first();
                        if ($firstProdi) {
                            $kode_prodi = $firstProdi->kode_prodi;
                        } else {
                            $kode_prodi = 'AKT';
                            ProgramStudi::create([
                                'kode_prodi' => 'AKT',
                                'nama_prodi' => 'Akuntansi',
                                'status' => 'aktif',
                            ]);
                        }
                    }

                    MataKuliah::updateOrCreate([
                        'kode_mk' => $kode_mk,
                    ], [
                        'nama_mk' => $nama_mk,
                        'sks' => intval($sks),
                        'kode_prodi' => $kode_prodi,
                        'semester' => intval($semester),
                        'status' => 'aktif',
                        'nip_dosen' => $nip_dosen,
                    ]);

                    $importCount++;
                }
            });

            if ($importCount === 0) {
                return redirect()->back()->with('error', "Gagal mengimpor data. Berkas tidak memiliki data mata kuliah yang valid atau format kolom salah.");
            }

            $this->log("Mengimpor {$importCount} data mata kuliah baru dari Excel");
            return redirect()->back()->with('success', "Berhasil mengimpor {$importCount} data mata kuliah.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Terjadi kesalahan saat mengimpor mata kuliah: " . $e->getMessage());
        }
    }

    public function downloadTemplate($type)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        if ($type === 'dosen') {
            $headers = ['NIDN', 'Nama Pengawas', 'Jabatan Akademik', 'Email (Opsional)'];
            $sample = ['19850312001', 'Dr. John Doe, M.Si.', 'Lektor', 'johndoe@umi.ac.id'];
            $filename = 'template_import_pengawas.xlsx';
        } elseif ($type === 'mahasiswa') {
            $headers = ['NIM / NPM', 'Nama Mahasiswa', 'Kode Prodi', 'Angkatan', 'Kelas', 'Email (Opsional)', 'Password (Opsional)'];
            $sample = ['2101010001', 'Jane Smith', 'MNJ', '2024', 'A', 'janesmith@student.umi.ac.id', 'password'];
            $filename = 'template_import_mahasiswa.xlsx';
        } elseif ($type === 'matakuliah') {
            $headers = ['Kode MK', 'Nama Mata Kuliah', 'Jumlah SKS', 'Kode Prodi', 'Semester'];
            $sample = ['MAK101', 'Pengantar Akuntansi', '3', 'AKT', '1'];
            $filename = 'template_import_matakuliah.xlsx';
        } elseif ($type === 'jadwal') {
            $headers = ['No', 'Hari/Tanggal', 'Jam', 'Ruang 1', 'Ruang 2', 'Mata Kuliah', 'SKS', 'Kls', 'Jml Mhs', 'Dosen'];
            $sample = ['1', '2025-10-15', '08.00-10.00', 'R01', '', 'Pengantar Akuntansi', '3', 'A', '30', 'Dr. John Doe, M.Si.'];
            $filename = 'template_import_jadwal.xlsx';
            
            $sheet->setCellValue('B1', 'Jadwal Ujian Akhir Semester Ganjil 2025/2026');
            $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
        } else {
            abort(404);
        }

        $startRowHeader = ($type === 'jadwal') ? 6 : 1;
        $startRowSample = ($type === 'jadwal') ? 7 : 2;

        // Set Headers (for dosen, mahasiswa, matakuliah, jadwal)
        foreach ($headers as $colIdx => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . $startRowHeader, $header);
            
            // Format header bold
            $sheet->getStyle($colLetter . $startRowHeader)->getFont()->setBold(true);
        }

        // Set Sample Data (for dosen, mahasiswa, matakuliah, jadwal)
        foreach ($sample as $colIdx => $val) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . $startRowSample, $val);
        }

        // Auto-fit column width
        foreach ($headers as $colIdx => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        
        return response()->stream(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
            ]
        );
    }

    public function importJadwal(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
        ]);

        try {
            $file = $request->file('excel_file');
            $path = $file->getRealPath();

            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $importCount = 0;

            // Extract metadata from headers
            $title = trim($sheet->getCell('B1')->getValue() ?? '');
            $jenis_ujian = 'UTS';
            if (str_contains(strtolower($title), 'akhir semester') || str_contains(strtolower($title), 'uas')) {
                $jenis_ujian = 'UAS';
            }

            $semester_aktif = 'Ganjil 2025/2026';
            $tahun_akademik = '2025/2026';
            if (preg_match('/(\d{4}\/\d{4})/', $title, $matches)) {
                $tahun_akademik = $matches[1];
                $sem = str_contains(strtolower($title), 'ganjil') ? 'Ganjil' : 'Genap';
                $semester_aktif = $sem . ' ' . $tahun_akademik;
            }

            DB::transaction(function () use ($rows, &$importCount, $jenis_ujian, $semester_aktif, $tahun_akademik) {
                foreach ($rows as $idx => $row) {
                    if ($idx < 7) continue; // Skip titles and headers (starts at row 7)

                    $rawDate = trim($row['B'] ?? '');
                    $rawTime = trim($row['C'] ?? '');
                    $ruang1 = trim($row['D'] ?? '');
                    $ruang2 = trim($row['E'] ?? '');
                    $nama_mk = trim($row['F'] ?? '');
                    $kelas = trim($row['H'] ?? '');
                    $nama_dosen = trim($row['J'] ?? '');

                    // Skip empty rows
                    if (empty($rawDate) && empty($nama_mk)) continue;

                    // Parse Date
                    try {
                        if (is_numeric($rawDate)) {
                            $tanggal = date('Y-m-d', \PhpOffice\PhpSpreadsheet\Shared\Date::excelToTimestamp($rawDate));
                        } else {
                            $dateObj = \Carbon\Carbon::parse($rawDate);
                            $tanggal = $dateObj->format('Y-m-d');
                        }
                    } catch (\Exception $e) {
                        throw new \Exception("Format tanggal '{$rawDate}' tidak valid pada baris " . $idx);
                    }

                    // Parse Time
                    $timeParts = explode('-', $rawTime);
                    if (count($timeParts) !== 2) {
                        throw new \Exception("Format jam '{$rawTime}' tidak valid pada baris " . $idx);
                    }
                    $jam_mulai = str_replace('.', ':', trim($timeParts[0]));
                    $jam_selesai = str_replace('.', ':', trim($timeParts[1]));

                    if (strlen($jam_mulai) === 4) $jam_mulai = '0' . $jam_mulai;
                    if (strlen($jam_selesai) === 4) $jam_selesai = '0' . $jam_selesai;

                    // Find Mata Kuliah
                    $course = MataKuliah::where('nama_mk', 'LIKE', $nama_mk)->first();
                    if (!$course) {
                        throw new \Exception("Mata kuliah '{$nama_mk}' tidak ditemukan di database pada baris " . $idx);
                    }
                    $kode_mk = $course->kode_mk;

                    // Find Dosen
                    $dosen = Dosen::where('nama', 'LIKE', $nama_dosen)->first();
                    if (!$dosen) {
                        throw new \Exception("Dosen Pengawas '{$nama_dosen}' tidak ditemukan di database pada baris " . $idx);
                    }
                    $nip_dosen = $dosen->nip;

                    // Check Room Conflict
                    if (empty($ruang1)) {
                        throw new \Exception("Kolom Ruang 1 kosong pada baris " . $idx);
                    }
                    $ruang = $ruang1;
                    if (!empty($ruang2)) {
                        $ruang .= ' / ' . $ruang2;
                    }

                    $roomsToBook = array_filter(array_map('trim', explode('/', $ruang)));
                    $activeSchedules = JadwalUjian::where('tanggal', $tanggal)
                        ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                            $query->where('jam_mulai', '<', $jam_selesai)
                                  ->where('jam_selesai', '>', $jam_mulai);
                        })
                        ->get();

                    foreach ($activeSchedules as $existingSchedule) {
                        if ($existingSchedule->kode_mk === $kode_mk) continue;
                        $existingRooms = array_filter(array_map('trim', explode('/', $existingSchedule->ruang)));
                        foreach ($roomsToBook as $rBook) {
                            if (in_array($rBook, $existingRooms)) {
                                throw new \Exception("Bentrok Ruangan: Ruang '{$rBook}' sudah digunakan oleh ujian mata kuliah '{$existingSchedule->mataKuliah->nama_mk}' pada jam ini (baris " . $idx . ")");
                            }
                        }
                    }

                    // Check Lecturer Conflict
                    $lecturerConflict = JadwalUjian::where('tanggal', $tanggal)
                        ->where('nip_dosen', $nip_dosen)
                        ->where('kode_mk', '!=', $kode_mk)
                        ->where(function ($query) use ($jam_mulai, $jam_selesai) {
                            $query->where('jam_mulai', '<', $jam_selesai)
                                  ->where('jam_selesai', '>', $jam_mulai);
                        })
                        ->first();

                    if ($lecturerConflict) {
                        throw new \Exception("Bentrok Pengawas: Dosen '{$nama_dosen}' sudah ditugaskan mengawas ujian '{$lecturerConflict->mataKuliah->nama_mk}' pada jam ini (baris " . $idx . ")");
                    }

                    // Dosen Pengampu cannot be Pengawas Check
                    if ($course->nip_dosen === $nip_dosen) {
                        throw new \Exception("Aturan Validasi: Dosen Pengampu '{$nama_dosen}' tidak boleh mengawas ujian mata kuliah yang diampunya sendiri (baris " . $idx . ")");
                    }

                    if (strtotime($jam_mulai) >= strtotime($jam_selesai)) {
                        throw new \Exception("Aturan Validasi: Jam selesai harus lebih akhir dari jam mulai pada baris " . $idx);
                    }

                    $isSemGanjil = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'ganjil');
                    $isSemGenap = \Illuminate\Support\Str::contains(strtolower($semester_aktif), 'genap');

                    if ($isSemGanjil && $course->semester % 2 === 0) {
                        throw new \Exception("Aturan Validasi: Mata kuliah '{$course->nama_mk}' (Semester {$course->semester}) tidak dapat dijadwalkan pada semester aktif Ganjil (baris " . $idx . ")");
                    }
                    if ($isSemGenap && $course->semester % 2 !== 0) {
                        throw new \Exception("Aturan Validasi: Mata kuliah '{$course->nama_mk}' (Semester {$course->semester}) tidak dapat dijadwalkan pada semester aktif Genap (baris " . $idx . ")");
                    }

                    // Search for students
                    $students = Mahasiswa::where('kelas', $kelas)->get();
                    $studentNims = $students->pluck('nim')->toArray();

                    if (!empty($studentNims)) {
                        $studentConflict = PesertaUjian::whereIn('nim', $studentNims)
                            ->whereHas('jadwalUjian', function ($query) use ($tanggal, $jam_mulai, $jam_selesai) {
                                $query->where('tanggal', $tanggal)
                                      ->where('jam_mulai', '<', $jam_selesai)
                                      ->where('jam_selesai', '>', $jam_mulai);
                            })
                            ->with(['mahasiswa', 'jadwalUjian.mataKuliah'])
                            ->first();

                        if ($studentConflict) {
                            throw new \Exception("Bentrok Mahasiswa: Mahasiswa '{$studentConflict->mahasiswa->nama}' ({$studentConflict->nim}) sudah terjadwal mengikuti ujian '{$studentConflict->jadwalUjian->mataKuliah->nama_mk}' pada jam ini (baris " . $idx . ")");
                        }
                    }

                    // Insert Schedule
                    $jadwal = JadwalUjian::create([
                        'kode_mk' => $kode_mk,
                        'nip_dosen' => $nip_dosen,
                        'tanggal' => $tanggal,
                        'sesi' => $idx - 6,
                        'jam_mulai' => $jam_mulai,
                        'jam_selesai' => $jam_selesai,
                        'ruang' => $ruang,
                        'kelas' => $kelas,
                        'jenis_ujian' => $jenis_ujian,
                        'semester_aktif' => $semester_aktif,
                        'tahun_akademik' => $tahun_akademik,
                        'status' => 'terjadwal',
                        'token' => strtoupper(\Illuminate\Support\Str::random(6)),
                    ]);

                    foreach ($studentNims as $nim) {
                        PesertaUjian::create([
                            'jadwal_ujian_id' => $jadwal->id,
                            'nim' => $nim,
                            'kehadiran' => 'belum_ditentukan',
                        ]);
                    }

                    $importCount++;
                }
            });

            $this->log("Mengimpor {$importCount} jadwal ujian baru dari Excel");
            return redirect()->back()->with('success', "Berhasil mengimpor {$importCount} jadwal ujian dari Excel.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Impor dibatalkan: " . $e->getMessage());
        }
    }

}

