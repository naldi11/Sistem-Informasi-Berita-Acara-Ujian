<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DosenController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

// Role-based redirection when visiting /dashboard
Route::get('/dashboard', function () {
    $role = auth()->user()->role;
    if ($role === 'admin') {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('dosen.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    
    // Dosen & Mahasiswa CRUD
    Route::get('/users', [AdminController::class, 'usersIndex'])->name('admin.users');
    Route::post('/users/dosen', [AdminController::class, 'storeDosen'])->name('admin.users.storeDosen');
    Route::post('/users/mahasiswa', [AdminController::class, 'storeMahasiswa'])->name('admin.users.storeMahasiswa');
    Route::put('/users/dosen/{nip}', [AdminController::class, 'updateDosen'])->name('admin.users.updateDosen');
    Route::put('/users/mahasiswa/{nim}', [AdminController::class, 'updateMahasiswa'])->name('admin.users.updateMahasiswa');
    Route::delete('/users/dosen/{nip}', [AdminController::class, 'deleteDosen'])->name('admin.users.deleteDosen');
    Route::delete('/users/mahasiswa/{nim}', [AdminController::class, 'deleteMahasiswa'])->name('admin.users.deleteMahasiswa');
    Route::post('/users/import-dosen', [AdminController::class, 'importDosen'])->name('admin.users.importDosen');
    Route::post('/users/import-mahasiswa', [AdminController::class, 'importMahasiswa'])->name('admin.users.importMahasiswa');
    Route::get('/templates/download/{type}', [AdminController::class, 'downloadTemplate'])->name('admin.templates.download');

    // Prodi CRUD
    Route::get('/prodi', [AdminController::class, 'prodiIndex'])->name('admin.prodi');
    Route::post('/prodi', [AdminController::class, 'storeProdi'])->name('admin.prodi.store');
    Route::put('/prodi/{kode_prodi}', [AdminController::class, 'updateProdi'])->name('admin.prodi.update');
    Route::delete('/prodi/{kode_prodi}', [AdminController::class, 'deleteProdi'])->name('admin.prodi.delete');
    Route::put('/prodi/{kode_prodi}/kelas', [AdminController::class, 'updateKelasProdi'])->name('admin.prodi.updateKelas');

    // Mata Kuliah CRUD
    Route::get('/matakuliah', [AdminController::class, 'mataKuliahIndex'])->name('admin.matakuliah');
    Route::post('/matakuliah', [AdminController::class, 'storeMataKuliah'])->name('admin.matakuliah.store');
    Route::put('/matakuliah/{kode_mk}', [AdminController::class, 'updateMataKuliah'])->name('admin.matakuliah.update');
    Route::delete('/matakuliah/{kode_mk}', [AdminController::class, 'deleteMataKuliah'])->name('admin.matakuliah.delete');
    Route::post('/matakuliah/import', [AdminController::class, 'importMataKuliah'])->name('admin.matakuliah.import');

    // Jadwal Ujian CRUD & Excel Import
    Route::get('/jadwal', [AdminController::class, 'jadwalIndex'])->name('admin.jadwal');
    Route::post('/jadwal', [AdminController::class, 'storeJadwal'])->name('admin.jadwal.store');
    Route::put('/jadwal/{id}', [AdminController::class, 'updateJadwal'])->name('admin.jadwal.update');
    Route::delete('/jadwal/{id}', [AdminController::class, 'deleteJadwal'])->name('admin.jadwal.delete');
    Route::post('/jadwal/import', [AdminController::class, 'importJadwal'])->name('admin.jadwal.import');

    // Berita Acara Ujian list & validation
    Route::get('/berita-acara', [AdminController::class, 'beritaAcaraIndex'])->name('admin.berita-acara');
    Route::post('/berita-acara/{id}/validate', [AdminController::class, 'validateBeritaAcara'])->name('admin.berita-acara.validate');
    Route::get('/berita-acara/{id}/pdf', [AdminController::class, 'printBeritaAcaraPdf'])->name('admin.berita-acara.pdf');

    // Laporan Rekapitulasi & PDF Download
    Route::get('/laporan', [AdminController::class, 'laporanIndex'])->name('admin.laporan');
    Route::get('/laporan/export-pdf', [AdminController::class, 'exportLaporanPdf'])->name('admin.laporan.pdf');
    Route::get('/laporan/export-excel', [AdminController::class, 'exportLaporanExcel'])->name('admin.laporan.excel');

    // Settings
    Route::get('/pengaturan', [AdminController::class, 'pengaturanIndex'])->name('admin.pengaturan');
    Route::post('/pengaturan/profile', [AdminController::class, 'updateProfile'])->name('admin.pengaturan.profile');
    Route::post('/pengaturan/staff', [AdminController::class, 'addStaff'])->name('admin.pengaturan.staff');
    Route::delete('/pengaturan/staff/{id}', [AdminController::class, 'deleteStaff'])->name('admin.pengaturan.staff.delete');
});

// Dosen Routes
Route::middleware(['auth', 'role:dosen'])->prefix('dosen')->group(function () {
    Route::get('/dashboard', [DosenController::class, 'dashboard'])->name('dosen.dashboard');
    Route::get('/jadwal', [DosenController::class, 'jadwalIndex'])->name('dosen.jadwal');
    
    // Berita Acara Dosen
    Route::get('/berita-acara', [DosenController::class, 'beritaAcaraIndex'])->name('dosen.berita-acara');
    Route::get('/berita-acara/{jadwal_id}/input', [DosenController::class, 'inputBeritaAcara'])->name('dosen.berita-acara.input');
    Route::post('/berita-acara/{jadwal_id}/save', [DosenController::class, 'saveBeritaAcara'])->name('dosen.berita-acara.save');
    Route::get('/berita-acara/{id}/pdf', [DosenController::class, 'printPdf'])->name('dosen.berita-acara.pdf');
    
    // Laporan Dosen
    Route::get('/laporan', [DosenController::class, 'laporanIndex'])->name('dosen.laporan');
});

require __DIR__.'/auth.php';
