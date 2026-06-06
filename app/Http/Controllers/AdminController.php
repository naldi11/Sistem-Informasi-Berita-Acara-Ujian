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

        $latestSchedules = JadwalUjian::with(['mataKuliah', 'dosen'])
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
        $dosens = Dosen::with('programStudi')->get();
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
            'kode_prodi' => 'required|string|exists:program_studis,kode_prodi',
            'jabatan' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
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
            'ampu_mata_kuliah' => 'nullable|array',
            'ampu_mata_kuliah.*' => 'string|exists:mata_kuliahs,kode_mk',
            'ampu_kelas' => 'nullable|array',
            'ampu_kelas.*' => 'string',
        ]);

        DB::transaction(function () use ($request, $dosen) {
            $dosen->update($request->only('nama', 'kode_prodi', 'jabatan', 'status', 'ampu_mata_kuliah', 'ampu_kelas'));
            
            // Sync user details
            $user = User::where('nip', $dosen->nip)->first();
            if ($user) {
                $user->update([
                    'name' => $request->nama,
                    'status' => $request->status,
                ]);
            }
        });

        $this->log("Mengubah data dosen: {$request->nama} ({$nip})");
        return redirect()->back()->with('success', 'Data dosen berhasil diubah.');
    }

    public function deleteDosen($nip)
    {
        $dosen = Dosen::findOrFail($nip);
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
        $name = $mahasiswa->nama;
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
        $courses = MataKuliah::with('programStudi')->get();
        $prodis = ProgramStudi::where('status', 'aktif')->get();

        return Inertia::render('MataKuliah/Index', [
            'courses' => $courses,
            'prodis' => $prodis,
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
        $name = $course->nama_mk;
        $course->delete();

        $this->log("Menghapus mata kuliah: {$name} ({$kode_mk})");
        return redirect()->back()->with('success', 'Mata Kuliah berhasil dihapus.');
    }

    // --- CRUD Jadwal Ujian ---
    public function jadwalIndex()
    {
        $schedules = JadwalUjian::with(['mataKuliah', 'dosen', 'pesertaUjians.mahasiswa'])->get();
        $dosens = Dosen::where('status', 'aktif')->get();
        $courses = MataKuliah::where('status', 'aktif')->get();
        $mahasiswas = Mahasiswa::where('status', 'aktif')->get();
        $prodis = ProgramStudi::where('status', 'aktif')->get();

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

        $course = MataKuliah::findOrFail($request->kode_mk);
        if ($course->teori && !$course->praktek) {
            $dosen = Dosen::findOrFail($request->nip_dosen);
            $ampuMK = is_array($dosen->ampu_mata_kuliah) ? $dosen->ampu_mata_kuliah : [];
            $ampuKelas = is_array($dosen->ampu_kelas) ? $dosen->ampu_kelas : [];

            $isAmpuCourse = in_array($request->kode_mk, $ampuMK);
            $isAmpuClass = false;
            foreach ($ampuKelas as $k) {
                if (strcasecmp(trim($k), trim($request->kelas)) === 0) {
                    $isAmpuClass = true;
                    break;
                }
            }

            if ($isAmpuCourse && $isAmpuClass) {
                return redirect()->back()->withErrors([
                    'nip_dosen' => "Dosen {$dosen->nama} adalah Dosen Pengampu Teori untuk mata kuliah {$course->nama_mk} di kelas {$request->kelas} dan tidak dapat dipilih sebagai pengawas ujian."
                ])->withInput();
            }
        }

        DB::transaction(function () use ($request) {
            $jadwal = JadwalUjian::create($request->only(
                'kode_mk', 'nip_dosen', 'tanggal', 'sesi', 'jam_mulai', 'jam_selesai',
                'ruang', 'kelas', 'jenis_ujian', 'semester_aktif', 'tahun_akademik'
            ) + ['status' => 'terjadwal']);

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

        $course = MataKuliah::findOrFail($request->kode_mk);
        if ($course->teori && !$course->praktek) {
            $dosen = Dosen::findOrFail($request->nip_dosen);
            $ampuMK = is_array($dosen->ampu_mata_kuliah) ? $dosen->ampu_mata_kuliah : [];
            $ampuKelas = is_array($dosen->ampu_kelas) ? $dosen->ampu_kelas : [];

            $isAmpuCourse = in_array($request->kode_mk, $ampuMK);
            $isAmpuClass = false;
            foreach ($ampuKelas as $k) {
                if (strcasecmp(trim($k), trim($request->kelas)) === 0) {
                    $isAmpuClass = true;
                    break;
                }
            }

            if ($isAmpuCourse && $isAmpuClass) {
                return redirect()->back()->withErrors([
                    'nip_dosen' => "Dosen {$dosen->nama} adalah Dosen Pengampu Teori untuk mata kuliah {$course->nama_mk} di kelas {$request->kelas} dan tidak dapat dipilih sebagai pengawas ujian."
                ])->withInput();
            }
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
    public function beritaAcaraIndex()
    {
        $baus = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen'])->get();

        return Inertia::render('Admin/BeritaAcara', [
            'baus' => $baus,
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
        return redirect()->back()->with('success', 'Status validasi Berita Acara berhasil diperbarui.');
    }

    public function printBeritaAcaraPdf($id)
    {
        $bau = BeritaAcara::with(['jadwalUjian.mataKuliah', 'jadwalUjian.dosen', 'jadwalUjian.pesertaUjians.mahasiswa'])
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
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        
        $sheet->setCellValue('A2', 'FAKULTAS EKONOMI - UNIVERSITAS METHODIST INDONESIA');
        $sheet->mergeCells('A2:I2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        
        // Subtitle/Filters
        $periodText = ($request->start_date && $request->end_date) ? "Periode: {$request->start_date} s/d {$request->end_date}" : "Periode: Semua";
        $sheet->setCellValue('A3', $periodText);
        $sheet->mergeCells('A3:I3');
        $sheet->getStyle('A3')->getFont()->setItalic(true);

        // Headers
        $headers = ['No', 'Kode MK', 'Nama Mata Kuliah', 'Dosen Penguji', 'Tanggal', 'Kelas', 'Hadir', 'Absen', 'Status Validasi'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
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
            $sheet->setCellValue('G' . $rowIdx, $b->jumlah_hadir);
            $sheet->setCellValue('H' . $rowIdx, $b->jumlah_absen);
            $sheet->setCellValue('I' . $rowIdx, $b->status_validasi === 'tervalidasi' ? 'Valid' : 'Pending');
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
        return Inertia::render('Admin/Pengaturan', [
            'users' => $users,
        ]);
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

    // --- Manual Excel Import route ---
    public function importJadwal(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
            'jenis_ujian' => 'required|in:UTS,UAS',
            'semester_aktif' => 'required|string',
            'tahun_akademik' => 'required|string',
        ]);

        try {
            $file = $request->file('excel_file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $dosenMap = Dosen::pluck('nip', 'nama')->toArray();
            $courseMap = MataKuliah::pluck('kode_mk', 'nama_mk')->toArray();

            $getOrCreateDosen = function ($name) use (&$dosenMap) {
                $name = trim($name);
                if (empty($name)) return '19850312001';
                
                if (isset($dosenMap[$name])) {
                    return $dosenMap[$name];
                }

                $nip = '19800' . str_pad(count($dosenMap) + 1, 6, '0', STR_PAD_LEFT);
                $dosenMap[$name] = $nip;

                Dosen::create([
                    'nip' => $nip,
                    'nama' => $name,
                    'kode_prodi' => 'AKT',
                    'jabatan' => 'Lektor',
                    'status' => 'aktif',
                ]);

                User::create([
                    'name' => $name,
                    'email' => strtolower(preg_replace('/[^a-z]/', '', explode(' ', $name)[0] ?? 'dosen')) . '.' . substr($nip, -4) . '@umi.ac.id',
                    'password' => Hash::make('password123'),
                    'role' => 'dosen',
                    'nip' => $nip,
                    'status' => 'aktif',
                ]);

                return $nip;
            };

            $getOrCreateCourse = function ($name, $sks) use (&$courseMap) {
                $name = trim($name);
                if (empty($name)) return 'MK-UNKNOWN';

                if (isset($courseMap[$name])) {
                    return $courseMap[$name];
                }

                $code = 'MAK' . str_pad(count($courseMap) + 1, 3, '0', STR_PAD_LEFT);
                $courseMap[$name] = $code;

                MataKuliah::create([
                    'kode_mk' => $code,
                    'nama_mk' => $name,
                    'sks' => is_numeric($sks) ? intval($sks) : 3,
                    'kode_prodi' => 'AKT',
                    'semester' => 3,
                    'status' => 'aktif',
                ]);

                return $code;
            };

            $importCount = 0;
            $allStudents = Mahasiswa::all();

            DB::transaction(function () use ($rows, $request, $getOrCreateDosen, $getOrCreateCourse, &$importCount, $allStudents) {
                foreach ($rows as $idx => $row) {
                    // Header detection / skip
                    if ($idx < 5) continue;
                    
                    $dateVal = $row['A'] ?? $row['B'] ?? null;
                    $jamVal = $row['B'] ?? $row['C'] ?? null;
                    $ruang1 = $row['C'] ?? $row['D'] ?? null;
                    $courseName = $row['E'] ?? $row['F'] ?? null;
                    $sks = $row['F'] ?? $row['G'] ?? null;
                    $kelas = $row['G'] ?? $row['H'] ?? null;
                    $dosenName = $row['I'] ?? $row['J'] ?? null;

                    if (empty($courseName) || $courseName === 'Mata Kuliah' || !is_numeric($sks)) continue;

                    $date = $this->parseDateVal($dateVal);
                    $times = $this->parseTimeRangeVal($jamVal);
                    
                    $nip = $getOrCreateDosen($dosenName);
                    $kode_mk = $getOrCreateCourse($courseName, $sks);

                    $jadwal = JadwalUjian::create([
                        'kode_mk' => $kode_mk,
                        'nip_dosen' => $nip,
                        'tanggal' => $date,
                        'sesi' => $request->jenis_ujian . ' Sesi',
                        'jam_mulai' => $times[0],
                        'jam_selesai' => $times[1],
                        'ruang' => $ruang1 ?: 'R.101',
                        'kelas' => $kelas ?: 'A',
                        'jenis_ujian' => $request->jenis_ujian,
                        'semester_aktif' => $request->semester_aktif,
                        'tahun_akademik' => $request->tahun_akademik,
                        'status' => 'terjadwal',
                    ]);

                    // Automatically add the class to the course's program studi if not exists
                    $course = MataKuliah::where('kode_mk', $kode_mk)->first();
                    if ($course) {
                        $prodi = ProgramStudi::where('kode_prodi', $course->kode_prodi)->first();
                        if ($prodi) {
                            $kelasVal = $kelas ?: 'A';
                            $daftar = $prodi->daftar_kelas ?: [];
                            if (!in_array($kelasVal, $daftar)) {
                                $daftar[] = $kelasVal;
                                $prodi->daftar_kelas = $daftar;
                                $prodi->save();
                            }
                        }
                    }

                    // Link 20-25 random students as participants
                    if ($allStudents->count() > 0) {
                        $randomStudents = $allStudents->random(min($allStudents->count(), rand(20, 25)));
                        foreach ($randomStudents as $stud) {
                            PesertaUjian::create([
                                'jadwal_ujian_id' => $jadwal->id,
                                'nim' => $stud->nim,
                                'kehadiran' => 'belum_ditentukan',
                            ]);
                        }
                    }

                    $importCount++;
                }
            });

            if ($importCount === 0) {
                return redirect()->back()->with('error', "Gagal mengimpor data. Berkas tidak memiliki jadwal yang valid atau format kolom salah.");
            }

            $this->log("Mengimpor {$importCount} jadwal ujian baru dari Excel ({$request->jenis_ujian})");
            return redirect()->back()->with('success', "Berhasil mengimpor {$importCount} jadwal ujian.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Terjadi kesalahan saat mengimpor jadwal: " . $e->getMessage());
        }
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
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) continue; // Skip header

                    $nip = trim($row['A'] ?? '');
                    $nama = trim($row['B'] ?? '');
                    $kode_prodi = trim($row['C'] ?? 'AKT');
                    $jabatan = trim($row['D'] ?? 'Lektor');
                    $email = trim($row['E'] ?? '');
                    
                    $ampu_mata_kuliah_str = trim($row['F'] ?? '');
                    $ampu_kelas_str = trim($row['G'] ?? '');

                    $ampu_mata_kuliah = !empty($ampu_mata_kuliah_str) 
                        ? array_map('trim', explode(',', $ampu_mata_kuliah_str)) 
                        : [];
                    $ampu_kelas = !empty($ampu_kelas_str) 
                        ? array_map('trim', explode(',', $ampu_kelas_str)) 
                        : [];

                    if (empty($nip) || empty($nama)) continue;

                    if (!ProgramStudi::where('kode_prodi', $kode_prodi)->exists()) {
                        $kode_prodi = 'AKT';
                    }

                    Dosen::updateOrCreate([
                        'nip' => $nip,
                    ], [
                        'nama' => $nama,
                        'kode_prodi' => $kode_prodi,
                        'jabatan' => $jabatan,
                        'status' => 'aktif',
                        'ampu_mata_kuliah' => $ampu_mata_kuliah,
                        'ampu_kelas' => $ampu_kelas,
                    ]);

                    // Automatically add classes to the Dosen's program studi if not exists
                    $prodi = ProgramStudi::where('kode_prodi', $kode_prodi)->first();
                    if ($prodi && !empty($ampu_kelas)) {
                        $daftar = $prodi->daftar_kelas ?: [];
                        $updated = false;
                        foreach ($ampu_kelas as $kVal) {
                            $kValClean = trim($kVal);
                            if (!empty($kValClean) && !in_array($kValClean, $daftar)) {
                                $daftar[] = $kValClean;
                                $updated = true;
                            }
                        }
                        if ($updated) {
                            $prodi->daftar_kelas = $daftar;
                            $prodi->save();
                        }
                    }

                    if (empty($email)) {
                        $emailName = strtolower(preg_replace('/[^a-z]/', '', explode(' ', $nama)[0] ?? 'dosen'));
                        $email = $emailName . '.' . substr($nip, -4) . '@umi.ac.id';
                    }

                    User::updateOrCreate([
                        'nip' => $nip,
                    ], [
                        'name' => $nama,
                        'email' => $email,
                        'password' => Hash::make('password123'),
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

            DB::transaction(function () use ($rows, &$importCount) {
                foreach ($rows as $idx => $row) {
                    if ($idx === 1) continue; // Skip header

                    $nim = trim($row['A'] ?? '');
                    $nama = trim($row['B'] ?? '');
                    $kode_prodi = trim($row['C'] ?? 'AKT');
                    $angkatan = trim($row['D'] ?? '');
                    $kelas = trim($row['E'] ?? '');

                    if (empty($nim) || empty($nama)) continue;

                    if (empty($angkatan)) {
                        $angkatan = date('Y');
                    }

                    if (!ProgramStudi::where('kode_prodi', $kode_prodi)->exists()) {
                        $kode_prodi = 'AKT';
                    }

                    Mahasiswa::updateOrCreate([
                        'nim' => $nim,
                    ], [
                        'nama' => $nama,
                        'kode_prodi' => $kode_prodi,
                        'angkatan' => $angkatan,
                        'kelas' => $kelas ?: 'A',
                        'status' => 'aktif',
                    ]);

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

                    $kode_mk = trim($row['A'] ?? '');
                    $nama_mk = trim($row['B'] ?? '');
                    $sks = trim($row['C'] ?? '3');
                    $kode_prodi = trim($row['D'] ?? 'AKT');
                    $semester = trim($row['E'] ?? '1');
                    
                    $teori_val = strtolower(trim($row['F'] ?? ''));
                    $praktek_val = strtolower(trim($row['G'] ?? ''));

                    $teori = ($teori_val === 'y' || $teori_val === '1' || $teori_val === 'yes' || $teori_val === 'ya' || $teori_val === '') ? true : false;
                    $praktek = ($praktek_val === 'y' || $praktek_val === '1' || $praktek_val === 'yes' || $praktek_val === 'ya') ? true : false;
                    
                    if (!$teori && !$praktek) {
                        $teori = true;
                    }

                    if (empty($kode_mk) || empty($nama_mk)) continue;

                    if (!is_numeric($sks)) $sks = 3;
                    if (!is_numeric($semester)) $semester = 1;

                    if (!ProgramStudi::where('kode_prodi', $kode_prodi)->exists()) {
                        $kode_prodi = 'AKT';
                    }

                    MataKuliah::updateOrCreate([
                        'kode_mk' => $kode_mk,
                    ], [
                        'nama_mk' => $nama_mk,
                        'sks' => intval($sks),
                        'kode_prodi' => $kode_prodi,
                        'semester' => intval($semester),
                        'teori' => $teori ? 1 : 0,
                        'praktek' => $praktek ? 1 : 0,
                        'status' => 'aktif',
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
            $headers = ['NIP', 'Nama Dosen', 'Kode Prodi', 'Jabatan Akademik', 'Email (Opsional)', 'Mata Kuliah Diampu (Kode MK, pisah koma)', 'Kelas Diampu (pisah koma)'];
            $sample = ['19850312001', 'Dr. John Doe, M.Si.', 'AKT', 'Lektor', 'johndoe@umi.ac.id', 'MAK101,MAK102', 'A,B'];
            $filename = 'template_import_dosen.xlsx';
        } elseif ($type === 'mahasiswa') {
            $headers = ['NIM / NPM', 'Nama Mahasiswa', 'Kode Prodi', 'Angkatan', 'Kelas'];
            $sample = ['2101010001', 'Jane Smith', 'MNJ', '2024', 'A'];
            $filename = 'template_import_mahasiswa.xlsx';
        } elseif ($type === 'matakuliah') {
            $headers = ['Kode MK', 'Nama Mata Kuliah', 'Jumlah SKS', 'Kode Prodi', 'Semester', 'Teori (Ya/Tidak)', 'Praktek (Ya/Tidak)'];
            $sample = ['MAK101', 'Pengantar Akuntansi', '3', 'AKT', '1', 'Ya', 'Tidak'];
            $filename = 'template_import_matakuliah.xlsx';
        } elseif ($type === 'jadwal') {
            // Write titles in Row 1 & 2
            $sheet->setCellValue('A1', 'TEMPLATE IMPORT JADWAL UJIAN SIBAU');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->setCellValue('A2', 'Catatan: Baris 1-4 dilewati oleh sistem. Data dimulai dari baris ke-5 sebagai header.');
            $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10);
            
            $headers = ['Hari/Tanggal', 'Jam', 'Ruang 1', 'Ruang 2', 'Mata Kuliah', 'SKS', 'Kls', 'Jml Mhs', 'Dosen'];
            $sample = ['Senin, 08 Juni 2026', '08.30 - 10.00', 'R.301', '', 'Akuntansi Keuangan', '3', 'A', '35', 'Dr. John Doe, M.Si.'];
            $filename = 'template_import_jadwal.xlsx';

            // Set Headers on Row 5
            foreach ($headers as $colIdx => $header) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue($colLetter . '5', $header);
                $sheet->getStyle($colLetter . '5')->getFont()->setBold(true);
            }

            // Set Sample Data on Row 6
            foreach ($sample as $colIdx => $val) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue($colLetter . '6', $val);
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
        } else {
            abort(404);
        }

        // Set Headers (for dosen, mahasiswa, matakuliah)
        foreach ($headers as $colIdx => $header) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . '1', $header);
            
            // Format header bold
            $sheet->getStyle($colLetter . '1')->getFont()->setBold(true);
        }

        // Set Sample Data (for dosen, mahasiswa, matakuliah)
        foreach ($sample as $colIdx => $val) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . '2', $val);
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

    private function parseDateVal($cell)
    {
        if (!$cell) return date('Y-m-d');
        if ($cell instanceof \DateTime) {
            return $cell->format('Y-m-d');
        }
        if (is_numeric($cell)) {
            try {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($cell)->format('Y-m-d');
            } catch (\Exception $e) {}
        }
        try {
            $str = preg_replace('/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu),\s*/i', '', $cell);
            $months = [
                'januari' => 'january', 'februari' => 'february', 'maret' => 'march',
                'april' => 'april', 'mei' => 'may', 'juni' => 'june', 'juli' => 'july',
                'agustus' => 'august', 'september' => 'september', 'oktober' => 'october',
                'november' => 'november', 'desember' => 'december'
            ];
            $str = str_ireplace(array_keys($months), array_values($months), $str);
            $dt = new \DateTime($str);
            return $dt->format('Y-m-d');
        } catch (\Exception $e) {
            return date('Y-m-d');
        }
    }

    private function parseTimeRangeVal($jamStr)
    {
        if (!$jamStr) return ['08:30:00', '10:00:00'];
        $parts = explode('-', $jamStr);
        if (count($parts) === 2) {
            $start = trim(str_replace('.', ':', $parts[0]));
            $end = trim(str_replace('.', ':', $parts[1]));
            if (strlen($start) === 5) $start .= ':00';
            if (strlen($end) === 5) $end .= ':00';
            return [$start, $end];
        }
        return ['08:30:00', '10:00:00'];
    }
}
