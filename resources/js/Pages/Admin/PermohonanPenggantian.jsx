import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function PermohonanPenggantian({ permohonan, dosens }) {
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedPermohonan, setSelectedPermohonan] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        dosen_pengganti_nip: '',
    });

    const openApproveModal = (item) => {
        setSelectedPermohonan(item);
        setIsApproveModalOpen(true);
    };

    const closeApproveModal = () => {
        setIsApproveModalOpen(false);
        setSelectedPermohonan(null);
        reset();
    };

    const handleApprove = (e) => {
        e.preventDefault();
        post(route('admin.permohonan-penggantian.approve', selectedPermohonan.id), {
            preserveScroll: true,
            onSuccess: () => closeApproveModal(),
        });
    };

    const handleReject = (id) => {
        if (confirm('Apakah Anda yakin ingin menolak permohonan ini?')) {
            router.post(route('admin.permohonan-penggantian.reject', id), {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Permohonan Penggantian Pengawas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg border border-gray-200">
                        <header className="mb-6 border-b border-gray-200 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Kelola Permohonan Penggantian Pengawas
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Konfirmasi permohonan penggantian dosen pengawas ujian.
                            </p>
                        </header>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemohon</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal Ujian</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {permohonan.length > 0 ? (
                                        permohonan.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.pemohon?.nama}</div>
                                                    <div className="text-sm text-gray-500">NIP: {item.pemohon?.nip}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{item.jadwal_ujian?.mata_kuliah?.nama_mk}</div>
                                                    <div className="text-sm text-gray-500">{item.jadwal_ujian?.tanggal} | {item.jadwal_ujian?.jam_mulai}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 line-clamp-3" title={item.alasan}>{item.alasan}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                        ${item.status === 'disetujui' ? 'bg-green-100 text-green-800' : ''}
                                                        ${item.status === 'ditolak' ? 'bg-red-100 text-red-800' : ''}
                                                    `}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                    {item.status === 'disetujui' && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Pengganti:<br/> {item.pengganti?.nama}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => openApproveModal(item)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Setujui
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(item.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}
                                                    {(item.status === 'disetujui' || item.status === 'ditolak' || item.status === 'pending') && (
                                                        <a 
                                                            href={route('admin.permohonan-penggantian.surat', item.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            Dokumen
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                Belum ada permohonan masuk.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isApproveModalOpen} onClose={closeApproveModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Konfirmasi Persetujuan & Pilih Pengganti
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Pilih Dosen Pengganti untuk jadwal ujian ini.
                    </p>

                    <form onSubmit={handleApprove} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="dosen_pengganti_nip" className="block text-sm font-medium text-gray-700">
                                Dosen Pengganti
                            </label>
                            <select
                                id="dosen_pengganti_nip"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={data.dosen_pengganti_nip}
                                onChange={(e) => setData('dosen_pengganti_nip', e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Pilih Dosen --</option>
                                {dosens
                                    .filter(d => d.nip !== selectedPermohonan?.pemohon?.nip)
                                    .map((dosen) => (
                                    <option key={dosen.nip} value={dosen.nip}>
                                        {dosen.nama} ({dosen.nip})
                                    </option>
                                ))}
                            </select>
                            {errors.dosen_pengganti_nip && <p className="mt-2 text-sm text-red-600">{errors.dosen_pengganti_nip}</p>}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeApproveModal}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                            >
                                Setujui & Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
