<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekapitulasi Berita Acara Ujian</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
            margin: 0;
            padding: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header h3 {
            font-size: 12pt;
            margin: 5px 0 0 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header hr {
            border: 0;
            border-top: 2px solid #000;
            height: 1px;
            margin-top: 10px;
        }
        .filter-info {
            margin-bottom: 15px;
            font-size: 9pt;
        }
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .report-table th, .report-table td {
            border: 1px solid #666;
            padding: 6px;
            text-align: left;
            font-size: 9pt;
        }
        .report-table th {
            text-align: center;
            font-weight: bold;
            background-color: #e6e6e6;
        }
        .text-center {
            text-align: center;
        }
        .footer-sign {
            width: 100%;
            margin-top: 35px;
        }
        .footer-sign td {
            text-align: right;
            padding-right: 50px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>Laporan Rekapitulasi Berita Acara Ujian (BAU)</h2>
        <h3>Fakultas Ekonomi Universitas Methodist Indonesia</h3>
        <hr>
    </div>

    <div class="filter-info">
        <strong>Tanggal Cetak:</strong> {{ date('d-m-Y H:i') }} WIB<br>
        @if($filters['start_date'] ?? null)
            <strong>Periode:</strong> {{ $filters['start_date'] }} s/d {{ $filters['end_date'] }}<br>
        @endif
        @if($filters['semester_aktif'] ?? null)
            <strong>Semester Aktif:</strong> {{ $filters['semester_aktif'] }}<br>
        @endif
    </div>

    <table class="report-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 12%;">Kode MK</th>
                <th style="width: 25%;">Mata Kuliah</th>
                <th style="width: 23%;">Pengawas</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 8%;">Kelas</th>
                <th style="width: 5%;">Hadir</th>
                <th style="width: 5%;">Absen</th>
                <th style="width: 10%;">Validasi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($baus as $idx => $bau)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td class="text-center">{{ $bau->jadwalUjian->kode_mk }}</td>
                    <td>{{ $bau->jadwalUjian->mataKuliah->nama_mk }}</td>
                    <td>{{ $bau->jadwalUjian->dosen->nama }}</td>
                    <td class="text-center">{{ date('d-m-Y', strtotime($bau->jadwalUjian->tanggal)) }}</td>
                    <td class="text-center">{{ $bau->jadwalUjian->kelas }}</td>
                    <td class="text-center">{{ $bau->jumlah_hadir }}</td>
                    <td class="text-center">{{ $bau->jumlah_absen }}</td>
                    <td class="text-center" style="text-transform: capitalize;">
                        {{ $bau->status_validasi == 'tervalidasi' ? 'Valid' : 'Pending' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="text-center">Tidak ada data rekapitulasi berita acara ujian.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="footer-sign">
        <tr>
            <td>
                Medan, {{ date('d-m-Y') }}<br>
                Mengetahui,<br>
                Dekan Fakultas Ekonomi
                <br><br><br><br>
                <u><strong>Dr. Jeudi A.T.P. Sianturi, S.E., M.Si.</strong></u><br>
                NIDN. 19770312001
            </td>
        </tr>
    </table>

</body>
</html>
