import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';

export default function PermohonanPenggantian({ schedules, permohonan }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        jadwal_ujian_id: '',
        alasan: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dosen.permohonan-penggantian.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Permohonan Penggantian Pengawas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Form Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg border border-gray-200">
                        <header className="mb-6 border-b border-gray-200 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Form Permohonan Penggantian Pengawas Ujian
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Ajukan permohonan kepada admin jika Anda berhalangan hadir mengawasi ujian.
                            </p>
                        </header>

                        <form onSubmit={submit} className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="jadwal_ujian_id" className="block text-sm font-medium text-gray-700">
                                    Pilih Jadwal Ujian
                                </label>
                                <select
                                    id="jadwal_ujian_id"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition duration-150 ease-in-out"
                                    value={data.jadwal_ujian_id}
                                    onChange={(e) => setData('jadwal_ujian_id', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Pilih Jadwal Ujian --</option>
                                    {schedules.map((jadwal) => (
                                        <option key={jadwal.id} value={jadwal.id}>
                                            {jadwal.tanggal} | {jadwal.jam_mulai} - {jadwal.jam_selesai} | {jadwal.mata_kuliah?.nama_mk} (Kelas: {jadwal.kelas})
                                        </option>
                                    ))}
                                </select>
                                {errors.jadwal_ujian_id && <p className="mt-2 text-sm text-red-600">{errors.jadwal_ujian_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="alasan" className="block text-sm font-medium text-gray-700">
                                    Alasan Berhalangan Hadir
                                </label>
                                <textarea
                                    id="alasan"
                                    rows="4"
                                    className="mt-1 block w-full border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm transition duration-150 ease-in-out"
                                    value={data.alasan}
                                    onChange={(e) => setData('alasan', e.target.value)}
                                    placeholder="Tuliskan alasan lengkap mengapa Anda membutuhkan dosen pengganti..."
                                    required
                                ></textarea>
                                {errors.alasan && <p className="mt-2 text-sm text-red-600">{errors.alasan}</p>}
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-25"
                                >
                                    Kirim Permohonan
                                </button>
                                {processing && <span className="text-sm text-gray-600">Memproses...</span>}
                            </div>
                        </form>
                    </div>

                    {/* History Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg border border-gray-200">
                        <header className="mb-6 border-b border-gray-200 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Riwayat Permohonan Anda
                            </h2>
                        </header>
                        
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Kuliah / Tanggal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosen Pengganti</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {permohonan.length > 0 ? (
                                        permohonan.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.jadwal_ujian?.mata_kuliah?.nama_mk}</div>
                                                    <div className="text-sm text-gray-500">{item.jadwal_ujian?.tanggal} | {item.jadwal_ujian?.jam_mulai}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 line-clamp-2" title={item.alasan}>{item.alasan}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                        ${item.status === 'disetujui' ? 'bg-green-100 text-green-800' : ''}
                                                        ${item.status === 'ditolak' ? 'bg-red-100 text-red-800' : ''}
                                                    `}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.pengganti ? item.pengganti.nama : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                Tidak ada riwayat permohonan penggantian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
