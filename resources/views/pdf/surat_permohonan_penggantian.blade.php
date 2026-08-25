<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Penggantian Pengawas Ujian - UMI Medan</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            margin: 1.5cm 2cm;
        }
        .kop-surat {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 8px;
            margin-bottom: 20px;
        }
        .kop-surat h2 {
            font-size: 15pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
        }
        .kop-surat h1 {
            font-size: 17pt;
            font-weight: bold;
            margin: 2px 0;
            text-transform: uppercase;
            color: #1e3a8a;
        }
        .kop-surat p {
            font-size: 9.5pt;
            margin: 0;
            color: #334155;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .mt-1 { margin-top: 10px; }
        .mt-2 { margin-top: 20px; }
        .mt-3 { margin-top: 30px; }
        .mb-1 { margin-bottom: 10px; }
        .mb-2 { margin-bottom: 20px; }
        .bold { font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; }
        .table-info td { vertical-align: top; padding: 5px 0; }
        .col-label { width: 28%; font-weight: 600; color: #334155; }
        .col-colon { width: 3%; }
        
        .box-detail {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 12px 0;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            font-size: 10pt;
            font-weight: bold;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .status-disetujui {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }
        .status-pending {
            background-color: #fef9c3;
            color: #a16207;
            border: 1px solid #fef08a;
        }
        .status-ditolak {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }

        .digital-validation-card {
            margin-top: 35px;
            border: 2px dashed #0284c7;
            background-color: #f0f9ff;
            border-radius: 8px;
            padding: 15px 20px;
            text-align: center;
        }
        .digital-validation-title {
            font-size: 10pt;
            font-weight: bold;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .digital-validation-desc {
            font-size: 9pt;
            color: #334155;
            line-height: 1.4;
        }
        .digital-footer-info {
            margin-top: 8px;
            font-size: 8.5pt;
            color: #64748b;
            font-family: monospace;
        }
    </style>
</head>
<body>

    <!-- Kop Surat UMI Medan -->
    <div class="kop-surat">
        <h2>UNIVERSITAS METHODIST INDONESIA</h2>
        <h1>FAKULTAS EKONOMI</h1>
        <p>Jl. Hang Tuah No. 8, Madras Hulu, Kec. Medan Polonia, Kota Medan, Sumatera Utara 20151</p>
        <p>Email: fe@umi.ac.id | Website: www.umi.ac.id | Akreditasi Institusi Baik Sekali</p>
    </div>

    <!-- Judul Dokumen -->
    <div class="text-center mb-2">
        <h3 style="text-decoration: underline; margin-bottom: 2px; font-size: 13pt; text-transform: uppercase;">
            SURAT KETERANGAN PENGGANTIAN PENGAWAS UJIAN
        </h3>
        <p style="margin: 0; font-size: 10pt; color: #475569;">
            Nomor: {{ sprintf('%03d', $permohonan->id) }}/FE-UMI/PP/{{ $year }}
        </p>
    </div>

    <div>
        <p style="margin-bottom: 8px;">
            Diterbitkan secara sah melalui <strong>Sistem Informasi Berita Acara Ujian (SIBAU)</strong> Fakultas Ekonomi Universitas Methodist Indonesia Medan.
        </p>

        <!-- Informansi Pemohon -->
        <div class="box-detail">
            <h4 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 10.5pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                I. DATA DOSEN PEMOHON (PENGAWAS UTAMA)
            </h4>
            <table class="table-info">
                <tr>
                    <td class="col-label">Nama Dosen</td>
                    <td class="col-colon">:</td>
                    <td><strong>{{ $permohonan->pemohon->nama }}</strong></td>
                </tr>
                <tr>
                    <td class="col-label">NIP / NIDN</td>
                    <td class="col-colon">:</td>
                    <td>{{ $permohonan->pemohon->nip }}</td>
                </tr>
                <tr>
                    <td class="col-label">Jabatan Akademik</td>
                    <td class="col-colon">:</td>
                    <td>{{ $permohonan->pemohon->jabatan ?? 'Dosen Pengawas' }}</td>
                </tr>
            </table>
        </div>

        <!-- Detail Ujian -->
        <div class="box-detail">
            <h4 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 10.5pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                II. RINCIAN JADWAL UJIAN
            </h4>
            <table class="table-info">
                <tr>
                    <td class="col-label">Mata Kuliah</td>
                    <td class="col-colon">:</td>
                    <td><strong>{{ $permohonan->jadwalUjian->mataKuliah->nama_mk }}</strong> (Kelas: {{ $permohonan->jadwalUjian->kelas }})</td>
                </tr>
                <tr>
                    <td class="col-label">Program Studi</td>
                    <td class="col-colon">:</td>
                    <td>{{ $permohonan->jadwalUjian->mataKuliah->programStudi->nama_prodi ?? '-' }}</td>
                </tr>
                <tr>
                    <td class="col-label">Hari, Tanggal</td>
                    <td class="col-colon">:</td>
                    <td>{{ $ujianDayName }}, {{ \Carbon\Carbon::parse($permohonan->jadwalUjian->tanggal)->translatedFormat('d F Y') }}</td>
                </tr>
                <tr>
                    <td class="col-label">Waktu Ujian</td>
                    <td class="col-colon">:</td>
                    <td>{{ \Carbon\Carbon::parse($permohonan->jadwalUjian->jam_mulai)->format('H:i') }} - {{ \Carbon\Carbon::parse($permohonan->jadwalUjian->jam_selesai)->format('H:i') }} WIB</td>
                </tr>
                <tr>
                    <td class="col-label">Ruang Ujian</td>
                    <td class="col-colon">:</td>
                    <td>Ruang {{ $permohonan->jadwalUjian->ruang }}</td>
                </tr>
                <tr>
                    <td class="col-label">Alasan Penggantian</td>
                    <td class="col-colon">:</td>
                    <td style="font-style: italic; color: #334155;">"{{ $permohonan->alasan }}"</td>
                </tr>
            </table>
        </div>

        <!-- Status & Pengganti -->
        <div class="box-detail">
            <h4 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 10.5pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                III. STATUS PERSETUJUAN & DOSEN PENGGANTI
            </h4>
            <table class="table-info">
                <tr>
                    <td class="col-label">Status Permohonan</td>
                    <td class="col-colon">:</td>
                    <td>
                        @if($permohonan->status == 'disetujui')
                            <span class="status-badge status-disetujui">✔ DISETUJUI ADMIN</span>
                        @elseif($permohonan->status == 'ditolak')
                            <span class="status-badge status-ditolak">✘ DITOLAK</span>
                        @else
                            <span class="status-badge status-pending">⏳ MENUNGGU KONFIRMASI</span>
                        @endif
                    </td>
                </tr>
                @if($permohonan->status == 'disetujui' && $permohonan->pengganti)
                <tr>
                    <td class="col-label">Dosen Pengganti Resmi</td>
                    <td class="col-colon">:</td>
                    <td><strong>{{ $permohonan->pengganti->nama }}</strong> (NIP: {{ $permohonan->pengganti->nip }})</td>
                </tr>
                @endif
            </table>
        </div>
    </div>

    <!-- Pengesahan Digital (Otomatis Tanpa Tanda Tangan Fisik) -->
    <div class="digital-validation-card">
        <div class="digital-validation-title">
            🛡️ DOKUMEN RESMI TERVERIFIKASI DIGITAL
        </div>
        <div class="digital-validation-desc">
            Surat Keterangan Penggantian Pengawas Ujian ini diterbitkan dan disahkan secara elektronik oleh <strong>Panitia Ujian Fakultas Ekonomi Universitas Methodist Indonesia</strong>.<br>
            Dokumen ini berlaku secara sah dan resmi sebagai bukti penggantian dosen pengawas tanpa memerlukan tanda tangan basah/stempel fisik.
        </div>
        <div class="digital-footer-info">
            Disetujui Tanggal: {{ \Carbon\Carbon::parse($permohonan->updated_at)->translatedFormat('d F Y, H:i') }} WIB | Ref-ID: SIBAU-UMI-{{ strtoupper(md5($permohonan->id . $permohonan->created_at)) }}
        </div>
    </div>

</body>
</html>
