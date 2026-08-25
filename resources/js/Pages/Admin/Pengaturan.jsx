import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Pengaturan({ users, securitySettings }) {
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

    // Attendance Security Form
    const securityForm = useForm({
        attendance_token_enabled: securitySettings ? securitySettings.attendance_token_enabled : true,
        attendance_gps_enabled: securitySettings ? securitySettings.attendance_gps_enabled : false,
        attendance_ip_enabled: securitySettings ? securitySettings.attendance_ip_enabled : false,
        campus_latitude: securitySettings ? securitySettings.campus_latitude : -5.1476,
        campus_longitude: securitySettings ? securitySettings.campus_longitude : 119.4328,
        campus_radius: securitySettings ? securitySettings.campus_radius : 100,
        campus_ip_whitelist: securitySettings ? securitySettings.campus_ip_whitelist : '',
    });

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.post(route('admin.pengaturan.profile'), {
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

    const submitSecurity = (e) => {
        e.preventDefault();
        securityForm.post(route('admin.pengaturan.keamanan'), {
            onSuccess: () => {
                alert('Pengaturan keamanan absensi berhasil diperbarui.');
            }
        });
    };

    const getAdminLocation = () => {
        if (navigator.geolocation) {
            alert('Mengambil lokasi GPS Anda saat ini...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    securityForm.setData(data => ({
                        ...data,
                        campus_latitude: position.coords.latitude,
                        campus_longitude: position.coords.longitude,
                    }));
                },
                (error) => {
                    alert('Gagal mendeteksi lokasi GPS Anda: ' + error.message);
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert('Browser Anda tidak mendukung deteksi lokasi (GPS).');
        }
    };

    const deleteStaff = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus staf ini?')) {
            staffForm.delete(route('admin.pengaturan.staff.delete', { id: id }));
        }
    };

    return (
        <AuthenticatedLayout subtitle="Pengaturan Sistem & Manajemen Pengguna">
            <Head title="Pengaturan Sistem - BERITA UJIAN" />

            <div className="sibau-settings-grid">
                {/* Left Column containing Profile and Attendance Security */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Profil Saya Card */}
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

                    {/* Attendance Security Card */}
                    <div className="sibau-card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '13pt', fontWeight: '700', marginBottom: '20px' }}>🛡️ Keamanan & Anti-Kecurangan Absensi</h3>
                        
                        <form onSubmit={submitSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Token Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <div>
                                    <strong style={{ fontSize: '10pt', display: 'block' }}>Wajibkan Token Ujian</strong>
                                    <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Mahasiswa harus input token dari pengawas</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={securityForm.data.attendance_token_enabled} 
                                    onChange={e => securityForm.setData('attendance_token_enabled', e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </div>

                            {/* GPS Geofencing Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <div>
                                    <strong style={{ fontSize: '10pt', display: 'block' }}>Wajibkan Geofencing (GPS)</strong>
                                    <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Absensi hanya diizinkan di koordinat kampus</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={securityForm.data.attendance_gps_enabled} 
                                    onChange={e => securityForm.setData('attendance_gps_enabled', e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </div>

                            {securityForm.data.attendance_gps_enabled && (
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label" style={{ fontSize: '8.5pt' }}>Latitude Kampus</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                className="sibau-input" 
                                                style={{ padding: '6px' }}
                                                value={securityForm.data.campus_latitude}
                                                onChange={e => securityForm.setData('campus_latitude', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label" style={{ fontSize: '8.5pt' }}>Longitude Kampus</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                className="sibau-input" 
                                                style={{ padding: '6px' }}
                                                value={securityForm.data.campus_longitude}
                                                onChange={e => securityForm.setData('campus_longitude', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className="sibau-label" style={{ fontSize: '8.5pt' }}>Radius Maksimal (Meter)</label>
                                            <input 
                                                type="number" 
                                                className="sibau-input" 
                                                style={{ padding: '6px' }}
                                                value={securityForm.data.campus_radius}
                                                onChange={e => securityForm.setData('campus_radius', e.target.value)}
                                                required
                                                min="5"
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={getAdminLocation}
                                            className="sibau-btn sibau-btn-secondary"
                                            style={{ marginTop: '14px', padding: '8px 10px', fontSize: '8pt', whiteSpace: 'nowrap' }}
                                        >
                                            📍 Ambil GPS Saya
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* IP range Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <div>
                                    <strong style={{ fontSize: '10pt', display: 'block' }}>Wajibkan Wi-Fi Kampus (IP)</strong>
                                    <span style={{ fontSize: '8.5pt', color: 'var(--text-muted)' }}>Batasi absensi ke jaringan Wi-Fi institusi</span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={securityForm.data.attendance_ip_enabled} 
                                    onChange={e => securityForm.setData('attendance_ip_enabled', e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </div>

                            {securityForm.data.attendance_ip_enabled && (
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <label className="sibau-label" style={{ fontSize: '8.5pt' }}>Daftar IP / Subnet Whitelist</label>
                                    <textarea 
                                        className="sibau-textarea"
                                        style={{ fontSize: '9pt', minHeight: '60px', padding: '8px' }}
                                        placeholder="Contoh: 127.0.0.1, 192.168.1.0/24, 182.253.*"
                                        value={securityForm.data.campus_ip_whitelist}
                                        onChange={e => securityForm.setData('campus_ip_whitelist', e.target.value)}
                                    />
                                    <span style={{ fontSize: '7.5pt', color: 'var(--text-muted)', display: 'block', marginTop: '4px', lineHeight: '1.3' }}>
                                        * Pisahkan dengan tanda koma. Mendukung IP tunggal, CIDR subnet (e.g. /24), dan wildcard (*).
                                    </span>
                                </div>
                            )}

                            <button type="submit" disabled={securityForm.processing} className="sibau-btn sibau-btn-primary">
                                Simpan Aturan Keamanan
                            </button>
                        </form>
                    </div>

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
                                            {u.nip && <div style={{ fontSize: '8pt', color: 'var(--text-muted)', fontFamily: 'monospace' }}>NIDN: {u.nip}</div>}
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
                                        <label className="sibau-label">NIDN (untuk Dosen)</label>
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
