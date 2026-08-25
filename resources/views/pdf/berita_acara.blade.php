<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Berita Acara Ujian</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.3;
            color: #000;
            margin: 0;
            padding: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            position: relative;
        }
        .header h2 {
            font-size: 16pt;
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header h3 {
            font-size: 14pt;
            margin: 5px 0 0 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header h4 {
            font-size: 13pt;
            margin: 5px 0 0 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header hr {
            border: 0;
            border-top: 2px solid #000;
            border-bottom: 1px solid #000;
            height: 3px;
            margin-top: 10px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .content-text {
            text-align: justify;
            margin-bottom: 15px;
        }
        .student-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .student-table th, .student-table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
            font-size: 10pt;
        }
        .student-table th {
            text-align: center;
            font-weight: bold;
            background-color: #f2f2f2;
        }
        .text-center {
            text-align: center;
        }
        .footer-sign {
            width: 100%;
            margin-top: 30px;
        }
        .footer-sign td {
            width: 50%;
            text-align: center;
        }
        .signature-img {
            max-height: 40px;
            max-width: 120px;
        }
        .notes-box {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 20px;
            min-height: 60px;
        }
        .summary-box {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
        }
        .summary-box th {
            background-color: #f2f2f2;
            border: 1px solid #000;
            padding: 8px 12px;
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
        }
        .summary-box td {
            border: 1px solid #000;
            padding: 10px 12px;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
        }
        .summary-label {
            font-size: 9pt;
            font-weight: normal;
            color: #333;
            display: block;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>Berita Acara</h2>
        <h3>Ujian {{ $bau->jadwalUjian->jenis_ujian == 'UTS' ? 'Tengah' : 'Akhir' }} Semester ({{ $bau->jadwalUjian->jenis_ujian }})</h3>
        <h4>Fakultas Ekonomi Universitas Methodist Indonesia</h4>
        <div style="font-size: 11pt; margin-top: 2px;">Tahun Akademik: {{ $bau->jadwalUjian->tahun_akademik }}</div>
        <hr>
    </div>

    <div class="content-text">
        Pada hari ini <strong>{{ $dayName }}</strong>, tanggal <strong>{{ $dayNum }}</strong> bulan <strong>{{ $monthName }}</strong> tahun <strong>{{ $year }}</strong>, pukul <strong>{{ substr($bau->jam_mulai_aktual, 0, 5) }}</strong> s/d <strong>{{ substr($bau->jam_selesai_aktual, 0, 5) }}</strong> WIB, bertempat di ruangan <strong>{{ $bau->jadwalUjian->ruang }}</strong> telah dilaksanakan Ujian {{ $bau->jadwalUjian->jenis_ujian == 'UTS' ? 'Tengah' : 'Akhir' }} Semester {{ $bau->jadwalUjian->semester_aktif }} untuk:
    </div>

    <table class="info-table">
        <tr>
            <td style="width: 18%;">Mata Kuliah</td>
            <td style="width: 2%;">:</td>
            <td style="width: 80%;"><strong>{{ $bau->jadwalUjian->mataKuliah->nama_mk }} ({{ $bau->jadwalUjian->mataKuliah->sks }} SKS)</strong></td>
        </tr>
        <tr>
            <td>Pengampu</td>
            <td>:</td>
            <td>{{ $bau->jadwalUjian->mataKuliah->dosenPengampu?->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td>Kelas / Semester</td>
            <td>:</td>
            <td>{{ $bau->jadwalUjian->kelas }} / Semester {{ $bau->jadwalUjian->mataKuliah->semester }}</td>
        </tr>
        <tr>
            <td>Jumlah Peserta</td>
            <td>:</td>
            <td>{{ $bau->jumlah_hadir + $bau->jumlah_absen }} orang (Hadir: {{ $bau->jumlah_hadir }}, Absen: {{ $bau->jumlah_absen }})</td>
        </tr>
    </table>

    <div style="font-weight: bold; margin-bottom: 5px;">Kejadian/Catatan Selama Ujian:</div>
    <div class="notes-box">
        {{ $bau->catatan ?: 'Ujian berlangsung tertib, aman, dan lancar.' }}
    </div>

    <div style="font-weight: bold; margin-bottom: 8px;">Rekapitulasi Kehadiran Peserta Ujian:</div>
    <table class="summary-box">
        <thead>
            <tr>
                <th>Total Terdaftar</th>
                <th>Hadir</th>
                <th>Tidak Hadir (Absen)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    {{ $bau->jumlah_hadir + $bau->jumlah_absen }}
                    <span class="summary-label">Mahasiswa</span>
                </td>
                <td style="color: #006400;">
                    {{ $bau->jumlah_hadir }}
                    <span class="summary-label">Mahasiswa</span>
                </td>
                <td style="color: #cc0000;">
                    {{ $bau->jumlah_absen }}
                    <span class="summary-label">Mahasiswa</span>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="content-text" style="margin-top: 15px;">
        Demikian berita acara ini diperbuat dengan sesungguhnya untuk dapat dipergunakan seperlunya.
    </div>

    <table class="footer-sign">
        <tr>
            <td></td>
            <td>
                Medan, {{ date('d') }} {{ $monthName }} {{ date('Y') }}<br>
                Pengawas Ujian,
                <br>
                <div style="margin: 8px 0;">
                    <img src="{{ $qrCode }}" alt="QR Code Signature" style="width: 100px; height: 100px; display: inline-block;">
                </div>
                <u><strong>{{ $bau->jadwalUjian->dosen->nama }}</strong></u><br>
                NIDN: {{ $bau->jadwalUjian->dosen->nip }}
            </td>
        </tr>
    </table>

</body>
</html>
