import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Pengaturan({ users }) {
    const loggedInUser = usePage().props.auth.user;
    const [staffModalOpen, setStaffModalOpen] = useState(false);

    // Profile Form
    const profileForm = useForm({
        name: loggedInUser.name,
        email: loggedInUser.email,
        password: '',
        password_confirmation: '',
    });

    // Staff Form
    const staffForm = useForm({
        name: '',
        email: '',
        role: 'dosen',
        nip: '',
        password: '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.post(route('admin.gradprofile.update' ? 'admin.pengaturan.profile' : 'admin.pengaturan.profile'), {
            onSuccess: () => {
                profileForm.reset('password', 'password_confirmation');
                alert('Profil berhasil diperbarui.');
            }
        });
    };

    const submitStaff = (e) => {
        e.preventDefault();
        staffForm.post(route('admin.pengaturan.staff'), {
            onSuccess: () => {
                setStaffModalOpen(false);
                staffForm.reset();
            }
        });
    };

    const deleteStaff = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus staf ini?')) {
            staffForm.delete(route('admin.pengaturan.staff.delete', { id: id }));
        }
    };

    return (
        <AuthenticatedLayout subtitle="Pengaturan Sistem & Manajemen Pengguna">
            <Head title="Pengaturan Sistem - SIBAU" />

            <div className="sibau-settings-grid">
                {/* Left Panel: Profil Saya */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '13pt', fontWeight: '700', marginBottom: '20px' }}>👤 Profil Saya</h3>
                    
                    <form onSubmit={submitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="sibau-form-group">
                            <label className="sibau-label">Nama Lengkap</label>
                            <input 
                                type="text" 
                                className="sibau-input" 
                                value={profileForm.data.name} 
                                onChange={e => profileForm.setData('name', e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="sibau-form-group">
                            <label className="sibau-label">Email</label>
                            <input 
                                type="email" 
                                className="sibau-input" 
                                value={profileForm.data.email} 
                                onChange={e => profileForm.setData('email', e.target.value)} 
                                required 
                            />
                            {profileForm.errors.email && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{profileForm.errors.email}</div>}
                        </div>
                        <div className="sibau-form-group">
                            <label className="sibau-label">Ubah Password (opsional)</label>
                            <input 
                                type="password" 
                                className="sibau-input" 
                                placeholder="Kosongkan jika tidak diubah"
                                value={profileForm.data.password} 
                                onChange={e => profileForm.setData('password', e.target.value)} 
                            />
                            {profileForm.errors.password && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{profileForm.errors.password}</div>}
                        </div>
                        <div className="sibau-form-group">
                            <label className="sibau-label">Konfirmasi Password Baru</label>
                            <input 
                                type="password" 
                                className="sibau-input" 
                                placeholder="Kosongkan jika tidak diubah"
                                value={profileForm.data.password_confirmation} 
                                onChange={e => profileForm.setData('password_confirmation', e.target.value)} 
                            />
                        </div>
                        <button type="submit" disabled={profileForm.processing} className="sibau-btn sibau-btn-primary">Simpan Profil</button>
                    </form>
                </div>

                {/* Right Panel: Manajemen Pengguna */}
                <div className="sibau-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '13pt', fontWeight: '700' }}>👥 Manajemen Pengguna</h3>
                        <button onClick={() => setStaffModalOpen(true)} className="sibau-btn sibau-btn-primary sibau-btn-sm">+ Tambah User</button>
                    </div>

                    <div className="sibau-table-container">
                        <table className="sibau-table">
                            <thead>
                                <tr>
                                    <th>Nama Pengguna</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th style={{ width: '80px' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: '600' }}>
                                            {u.name}
                                            {u.nip && <div style={{ fontSize: '8pt', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NIP: {u.nip}</div>}
                                        </td>
                                        <td>{u.email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>
                                            <span className={`sibau-badge ${u.role === 'admin' ? 'badge-info' : 'badge-draft'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`sibau-badge ${u.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td>
                                            {u.id !== loggedInUser.id ? (
                                                <button onClick={() => deleteStaff(u.id)} className="sibau-btn sibau-btn-danger sibau-btn-sm" style={{ padding: '6px 10px' }}>Hapus</button>
                                            ) : (
                                                <span style={{ fontSize: '9pt', color: 'var(--text-muted)' }}>(Anda sendiri)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Staff */}
            {staffModalOpen && (
                <div className="sibau-modal-overlay">
                    <div className="sibau-modal">
                        <div className="sibau-modal-header">
                            <h3 className="sibau-modal-title">Tambah Staf Pengguna</h3>
                            <button onClick={() => setStaffModalOpen(false)} className="sibau-modal-close">×</button>
                        </div>
                        <form onSubmit={submitStaff}>
                            <div className="sibau-modal-body">
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        className="sibau-input" 
                                        value={staffForm.data.name} 
                                        onChange={e => staffForm.setData('name', e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Email Akun</label>
                                    <input 
                                        type="email" 
                                        className="sibau-input" 
                                        value={staffForm.data.email} 
                                        onChange={e => staffForm.setData('email', e.target.value)} 
                                        required 
                                    />
                                    {staffForm.errors.email && <div style={{ color: 'red', fontSize: '9pt', marginTop: '4px' }}>{staffForm.errors.email}</div>}
                                </div>
                                <div className="sibau-form-group" style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1.2 }}>
                                        <label className="sibau-label">Hak Akses / Role</label>
                                        <SearchableSelect 
                                            options={[
                                                { value: 'dosen', label: 'Dosen (Pengawas)' },
                                                { value: 'admin', label: 'Admin Fakultas' }
                                            ]}
                                            value={staffForm.data.role} 
                                            onChange={e => staffForm.setData('role', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 0.8 }}>
                                        <label className="sibau-label">NIP (untuk Dosen)</label>
                                        <input 
                                            type="text" 
                                            className="sibau-input" 
                                            value={staffForm.data.nip} 
                                            onChange={e => staffForm.setData('nip', e.target.value)} 
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="sibau-form-group">
                                    <label className="sibau-label">Kata Sandi</label>
                                    <input 
                                        type="password" 
                                        className="sibau-input" 
                                        value={staffForm.data.password} 
                                        onChange={e => staffForm.setData('password', e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="sibau-modal-footer">
                                <button type="button" onClick={() => setStaffModalOpen(false)} className="sibau-btn sibau-btn-secondary">Batal</button>
                                <button type="submit" disabled={staffForm.processing} className="sibau-btn sibau-btn-primary">Tambah User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
