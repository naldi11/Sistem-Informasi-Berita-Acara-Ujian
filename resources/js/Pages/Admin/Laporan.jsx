import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Laporan({ baus, courses, dosens, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [kodeMk, setKodeMk] = useState(filters.kode_mk || '');
    const [nipDosen, setNipDosen] = useState(filters.nip_dosen || '');
    const [semesterAktif, setSemesterAktif] = useState(
        filters.semester_aktif || '',
    );

    const [formatPdf, setFormatPdf] = useState(true);
    const [formatExcel, setFormatExcel] = useState(false);

    const handleSearch = () => {
        router.get(
            route('admin.laporan'),
            {
                start_date: startDate,
                end_date: endDate,
                kode_mk: kodeMk,
                nip_dosen: nipDosen,
                semester_aktif: semesterAktif,
            },
            { preserveState: true },
        );
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setKodeMk('');
        setNipDosen('');
        setSemesterAktif('');
        router.get(route('admin.laporan'), {});
    };

    const handleActionClick = (format) => {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            kode_mk: kodeMk,
            nip_dosen: nipDosen,
            semester_aktif: semesterAktif,
        }).toString();

        if (format === 'PDF') {
            window.open(`${route('admin.laporan.pdf')}?${params}`, '_blank');
        } else {
            window.open(`${route('admin.laporan.excel')}?${params}`, '_blank');
        }
    };

    return (
        <AuthenticatedLayout subtitle="Laporan Rekapitulasi Berita Acara Ujian">
            <Head title="Cetak Laporan - SIBAU" />

            <div className="sibau-laporan-layout">
                {/* Left Side: Report Preview Table */}
                <div className="sibau-laporan-main-panel sibau-card">
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '11pt',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                            }}
                        >
                            Universitas Methodist Indonesia
                        </h3>
                        <h4
                            style={{
                                margin: '4px 0 0 0',
                                fontSize: '10pt',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                            }}
                        >
                            Fakultas Ekonomi
                        </h4>
                        <h4
                            style={{
                                margin: '4px 0 0 0',
                                fontSize: '10.5pt',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                textDecoration: 'underline',
                            }}
                        >
                            Laporan Rekapitulasi Berita Acara Ujian (BAU)
                        </h4>
                        <div
                            style={{
                                fontSize: '8.5pt',
                                color: 'var(--text-muted)',
                                marginTop: '4px',
                            }}
                        >
                            {startDate && endDate
                                ? `Periode: ${startDate} s/d ${endDate}`
                                : 'Periode: Semua Periode'}
                        </div>
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th
                                        style={{ width: '5%' }}
                                        className="text-center"
                                    >
                                        No
                                    </th>
                                    <th style={{ width: '12%' }}>Kode MK</th>
                                    <th style={{ width: '25%' }}>
                                        Mata Kuliah
                                    </th>
                                    <th style={{ width: '23%' }}>
                                        Dosen Penguji
                                    </th>
                                    <th style={{ width: '12%' }}>Tanggal</th>
                                    <th
                                        style={{ width: '8%' }}
                                        className="text-center"
                                    >
                                        Kelas
                                    </th>
                                    <th
                                        style={{ width: '5%' }}
                                        className="text-center"
                                    >
                                        Hadir
                                    </th>
                                    <th
                                        style={{ width: '5%' }}
                                        className="text-center"
                                    >
                                        Absen
                                    </th>
                                    <th style={{ width: '10%' }}>Validasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {baus.data.map((b, idx) => (
                                    <tr key={b.id}>
                                        <td className="text-center">
                                            {idx + 1}
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>
                                            {b.jadwal_ujian.kode_mk}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>
                                            {b.jadwal_ujian.mata_kuliah.nama_mk}
                                        </td>
                                        <td>{b.jadwal_ujian.dosen.nama}</td>
                                        <td>{b.jadwal_ujian.tanggal}</td>
                                        <td className="text-center">
                                            {b.jadwal_ujian.kelas}
                                        </td>
                                        <td
                                            className="text-center"
                                            style={{
                                                color: 'var(--color-success)',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {b.jumlah_hadir}
                                        </td>
                                        <td
                                            className="text-center"
                                            style={{
                                                color: 'var(--color-danger)',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {b.jumlah_absen}
                                        </td>
                                        <td>
                                            <span
                                                className={`sibau-badge ${b.status_validasi === 'tervalidasi' ? 'badge-success' : 'badge-warning'}`}
                                            >
                                                {b.status_validasi ===
                                                'tervalidasi'
                                                    ? 'Valid'
                                                    : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {baus.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center"
                                            style={{
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            Tidak ada data rekapitulasi.
                                            Tentukan filter pada panel kanan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={baus} />
                </div>

                {/* Right Side: Report Options Panel */}
                <div className="sibau-report-options-panel sibau-card">
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '11pt',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Report Options
                    </h3>

                    {/* Format Section */}
                    <div>
                        <div className="report-section-title">
                            Format Laporan
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontSize: '9.5pt',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formatPdf}
                                    onChange={(e) =>
                                        setFormatPdf(e.target.checked)
                                    }
                                />
                                PDF Format
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontSize: '9.5pt',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={formatExcel}
                                    onChange={(e) =>
                                        setFormatExcel(e.target.checked)
                                    }
                                />
                                Excel Format
                            </label>
                        </div>
                    </div>

                    {/* Parameter Section */}
                    <div>
                        <div className="report-section-title">Parameter</div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <div>
                                <label className="sibau-label">
                                    Rentang Tanggal
                                </label>
                                <input
                                    type="date"
                                    className="sibau-input"
                                    style={{ marginBottom: '6px' }}
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                                <input
                                    type="date"
                                    className="sibau-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="sibau-label">Semester</label>
                                <input
                                    type="text"
                                    className="sibau-input"
                                    placeholder="e.g. Ganjil 2025/2026"
                                    value={semesterAktif}
                                    onChange={(e) =>
                                        setSemesterAktif(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="sibau-label">
                                    Mata Kuliah
                                </label>
                                <SearchableSelect
                                    options={[
                                        {
                                            value: '',
                                            label: 'Semua Mata Kuliah',
                                        },
                                        ...courses.map((c) => ({
                                            value: c.kode_mk,
                                            label: c.nama_mk,
                                        })),
                                    ]}
                                    value={kodeMk}
                                    onChange={(e) => setKodeMk(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="sibau-label">
                                    Dosen Penguji
                                </label>
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'Semua Dosen' },
                                        ...dosens.map((d) => ({
                                            value: d.nip,
                                            label: d.nama,
                                        })),
                                    ]}
                                    value={nipDosen}
                                    onChange={(e) =>
                                        setNipDosen(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div>
                        <div className="report-section-title">Aksi</div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <button
                                onClick={handleSearch}
                                className="sibau-btn sibau-btn-primary"
                                style={{ width: '100%' }}
                            >
                                🔍 Filter Data
                            </button>
                            <button
                                onClick={handleReset}
                                className="sibau-btn sibau-btn-secondary"
                                style={{ width: '100%' }}
                            >
                                🔄 Reset Filter
                            </button>

                            <div style={{ height: '8px' }}></div>

                            {formatPdf && (
                                <button
                                    onClick={() => handleActionClick('PDF')}
                                    className="sibau-btn sibau-btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={baus.total === 0}
                                >
                                    🖨️ CETAK LAPORAN (PDF)
                                </button>
                            )}
                            {formatExcel && (
                                <button
                                    onClick={() => handleActionClick('Excel')}
                                    className="sibau-btn sibau-btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={baus.total === 0}
                                >
                                    📊 EXPORT KE EXCEL
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
