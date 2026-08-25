# SIBAU — Sistem Informasi Berita Acara Ujian

Aplikasi pengelolaan jadwal ujian dan Berita Acara Ujian (BAU) untuk **Fakultas Ekonomi, Universitas Methodist Indonesia**.

Admin fakultas menyusun jadwal ujian beserta pesertanya, dosen pengawas mengisi berita acara (kehadiran, nilai, tanda tangan mahasiswa) langsung dari aplikasi, lalu admin memvalidasinya menjadi dokumen resmi yang bisa dicetak ke PDF atau direkap ke Excel.

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Backend | PHP 8.4, Laravel 13 |
| Frontend | Inertia.js 2 + React 18, Tailwind CSS 3, Vite 8 |
| Basis data | MySQL (SQLite in-memory untuk pengujian) |
| Dokumen | DomPDF (cetak BAU), PhpSpreadsheet (import/export Excel) |

## Kebutuhan

- **PHP 8.4 atau lebih baru** (`composer.lock` mengunci Symfony 8 yang mensyaratkan PHP ≥ 8.4.1). Pada MAMP, gunakan `/Applications/MAMP/bin/php/php8.4.x/bin/php`.
- Composer 2
- Node.js 20+ dan npm
- MySQL 8 / MariaDB 10.6+

## Instalasi

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Sesuaikan `DB_*` di `.env` (bawaan mengarah ke MAMP, port `8889`), lalu isi `SIBAU_ADMIN_PASSWORD` dengan kata sandi admin awal.

```bash
php artisan migrate --seed
npm install
npm run build
```

Seeder membuat satu akun administrator (`SIBAU_ADMIN_EMAIL`, bawaan `admin@umi.ac.id`) dan empat program studi. Data dosen, mahasiswa, mata kuliah, dan jadwal diisi lewat menu **Import Excel** di dalam aplikasi.

Menjalankan server pengembangan (Laravel + queue + log + Vite sekaligus):

```bash
composer dev
```

## Peran pengguna

| Peran | Kemampuan |
| --- | --- |
| **admin** | CRUD program studi, mata kuliah, dosen, mahasiswa, dan jadwal ujian; import Excel; validasi BAU; rekap laporan (PDF/Excel); kelola akun staf |
| **dosen** | Melihat jadwal mengawas; mengisi & mengajukan BAU; mencetak BAU miliknya; melihat arsip BAU tervalidasi |

**Registrasi mandiri sengaja dinonaktifkan.** Akun hanya dibuat oleh admin melalui menu *Pengaturan → Staf* atau *Data Dosen*, atau dibuat otomatis saat import dosen.

### Kata sandi akun hasil import

Akun dosen yang **baru** dibuat oleh import Excel memakai kata sandi bawaan dari `SIBAU_IMPORT_DEFAULT_PASSWORD` (lihat `config/sibau.php`). Nilai bawaannya `password` agar mudah dipakai saat demo, dan ditampilkan pada panel import supaya admin tahu apa yang harus disampaikan ke dosen.

Untuk penggunaan sungguhan, **kosongkan** nilainya di `.env`:

```dotenv
SIBAU_IMPORT_DEFAULT_PASSWORD=
```

Setiap akun baru lalu mendapat kata sandi acak, dan admin menyetelnya per dosen lewat tombol ✏️ Edit — atau dosen memakai fitur *Lupa Password* (butuh SMTP aktif; dengan `MAIL_MAILER=log`, tautan reset hanya muncul di `storage/logs/laravel.log`).

Apa pun nilainya, import **tidak pernah** mengubah kata sandi akun yang sudah ada.

## Alur Berita Acara

```
Admin menyusun jadwal + memilih peserta
        │
        ▼
Dosen mengisi kehadiran, nilai, tanda tangan   ──►  status BAU: draft
        │  (Kirim Berita Acara)
        ▼
                                               ──►  status BAU: menunggu_validasi
        │                                            status jadwal: berlangsung
        ▼
Admin memvalidasi                              ──►  status BAU: tervalidasi
                                                    status jadwal: selesai
```

Transisi status yang diizinkan:

- `draft` → *(hanya dosen, lewat pengajuan)* → `menunggu_validasi`
- `menunggu_validasi` → `tervalidasi` (validasi) atau `draft` (dikembalikan untuk revisi)
- `tervalidasi` → `menunggu_validasi` (batalkan validasi)

BAU berstatus `draft` **tidak dapat langsung divalidasi** karena belum diajukan dosen. BAU yang sudah `tervalidasi` terkunci: dosen tidak bisa mengubahnya, dan jadwalnya tidak bisa diedit atau dihapus sebelum validasinya dibatalkan.

## Aturan penjadwalan

Saat menyimpan jadwal ujian, sistem menolak bila:

1. Dosen yang dipilih adalah **pengampu teori** mata kuliah tersebut di kelas yang sama (khusus mata kuliah teori murni, tanpa komponen praktek).
2. **Ruang** sudah dipakai ujian lain pada rentang waktu yang beririsan.
3. **Pengawas** sudah ditugaskan di ujian lain pada rentang waktu yang beririsan.
4. Ada **mahasiswa** yang sudah terdaftar pada ujian lain di rentang waktu yang beririsan.

Jadwal berstatus `dibatalkan` tidak dihitung sebagai bentrok.

## Import Excel

Unduh templatnya lebih dulu dari menu terkait — tombol *Download Template* menghasilkan berkas dengan header dan satu baris contoh.

| Jenis | Baris header | Kolom |
| --- | --- | --- |
| Dosen | 1 | NIP, Nama, Kode Prodi, Jabatan, Email (opsional), Kode MK diampu (pisah koma), Kelas diampu (pisah koma) |
| Mahasiswa | 1 | NIM, Nama, Kode Prodi, Angkatan, Kelas |
| Mata Kuliah | 1 | Kode MK, Nama MK, SKS, Kode Prodi, Semester, Teori (Ya/Tidak), Praktek (Ya/Tidak) |
| Jadwal Ujian | 5 (data mulai baris 6) | Hari/Tanggal, Jam, Ruang 1, Ruang 2, Mata Kuliah, SKS, Kls, Jml Mhs, Dosen |

Catatan penting:

- Import **tidak** mengisi peserta ujian. Setelah import jadwal, buka *Jadwal Ujian → Edit* untuk memilih peserta tiap jadwal.
- Baris yang tanggal/jamnya tidak terbaca, atau yang nama dosen/ruangnya kosong, **dilewati** dan dilaporkan jumlah beserta alasannya — bukan diisi nilai karangan.
- Import **tidak pernah** menimpa kata sandi akun dosen yang sudah ada; lihat *Kata sandi akun hasil import* di atas.

## Pengujian

```bash
php artisan test
```

Berjalan di atas SQLite in-memory, jadi tidak menyentuh basis data pengembangan.

| Berkas | Cakupan |
| --- | --- |
| `tests/Feature/AksesAkunTest.php` | Registrasi tertutup, penolakan akun nonaktif, pemisahan peran |
| `tests/Feature/JadwalValidationTest.php` | Larangan dosen pengampu mengawas kelasnya |
| `tests/Feature/JadwalConflictTest.php` | Bentrok ruang, pengawas, dan peserta |
| `tests/Feature/BeritaAcaraTest.php` | Pengisian BAU, sinkronisasi peserta, transisi status validasi |
| `tests/Feature/AdminImportTest.php` | Import Excel: validasi, baris dilewati, penanganan kata sandi |
| `tests/Feature/LaporanExportTest.php` | Ekspor PDF/Excel dan ukuran muatan halaman |

Linting frontend:

```bash
npm run lint
```

## Struktur singkat

```
app/
  Http/Controllers/AdminController.php   Seluruh fitur admin
  Http/Controllers/DosenController.php   Fitur dosen pengawas
  Http/Middleware/RoleMiddleware.php     Pembatasan peran + cek akun aktif
  Support/JadwalValidator.php            Aturan pengampu & deteksi bentrok
  Support/TanggalIndonesia.php           Format & parsing tanggal Indonesia
resources/js/Pages/                      Halaman React (Inertia)
resources/views/pdf/                     Templat cetak BAU & rekap laporan
```
