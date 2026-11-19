import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import { Bell, LogOut, ShieldCheck, ChevronDown, Clock, MapPin, Sparkles, School, Camera, KeyRound, Eye, EyeOff, X, Check, ShieldAlert, Rocket, RefreshCw, Share2, CheckCircle2, Wifi } from 'lucide-react';
import { PhotoUploadModal } from './PhotoUploadModal';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
  onNavigateToProfile?: () => void;
  onOpenPublishModal?: () => void;
  onOpenShareModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenLoginModal,
  onNavigateToProfile,
  onOpenPublishModal,
  onOpenShareModal
}) => {
  const {
    currentUser,
    logout,
    notifications,
    schoolProfile,
    updateUserAvatar,
    changeOwnPassword,
    canEditSchoolData,
    hasPendingChanges,
    hasRemoteUpdate,
    localPublishedVersion,
    publishMeta,
    autoSaveStatus,
    serverReachable,
    realtimeConnected,
    connectedClientsCount,
    lastSyncedEvent,
    lastActionLabel,
    databaseSyncInfo
  } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMyPhotoModalOpen, setIsMyPhotoModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassFields, setShowPassFields] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (role: string, user?: { isOwner?: boolean; isPrincipal?: boolean; username?: string }) => {
    if (user?.isOwner || role === 'owner' || user?.username === 'pemilik.akun') {
      return { label: '👑 PEMILIK AKUN', bg: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold shadow-2xs' };
    }
    if (user?.isPrincipal || role === 'kepala_sekolah' || user?.username === 'kepala.sekolah') {
      return { label: '🏫 KEPALA SEKOLAH', bg: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold shadow-2xs' };
    }
    switch (role) {
      case 'guru':
        return { label: 'GURU / PENDIDIK', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'pegawai':
        return { label: 'TATA USAHA / STAF', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'ortu':
        return { label: 'WALI MURID', bg: 'bg-orange-100 text-orange-800 border-orange-300' };
      default:
        return { label: 'PENGELOLA', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role, currentUser);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-xs">
      {/* Top Islamic Banner Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1.5 px-4 sm:px-6 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-medium tracking-wide">
            Sistem Informasi Terpadu TK Al Mishbah •{' '}
            {autoSaveStatus === 'saving'
              ? `Menyimpan & Mengirim Real-Time${lastActionLabel ? ` (${lastActionLabel})` : ''}...`
              : realtimeConnected
              ? `Real-Time Portal Sync Aktif${
                  publishMeta.publishedVersion > 0 ? ` • v${publishMeta.publishedVersion}` : ''
                }${connectedClientsCount > 1 ? ` • ${connectedClientsCount} Perangkat` : ''}`
              : serverReachable
              ? 'Simpan & Update Otomatis Aktif'
              : 'Mode Lokal (Sinkronisasi Ulang Otomatis)'}
            {lastSyncedEvent ? ` • Update: ${lastSyncedEvent.actionLabel}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-4 text-emerald-100 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            {currentTime}
          </span>
          <span className="hidden md:flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            Radius Sekolah {schoolProfile.schoolCoordinates.radiusMeters}m
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div
          onClick={onNavigateToProfile}
          className="flex items-center gap-3 cursor-pointer group"
          title={
            currentUser.role === 'ortu'
              ? 'Kembali ke Beranda Wali Murid'
              : 'Klik untuk membuka Pengaturan Profil & Logo Sekolah'
          }
        >
          <div className="relative group cursor-pointer">
            <img
              src={schoolProfile.logoUrl}
              alt={schoolProfile.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-emerald-600 shadow-sm object-cover bg-white p-0.5 group-hover:scale-105 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full text-[9px] shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-emerald-950 tracking-tight font-sans group-hover:text-emerald-800 transition-colors">
                {schoolProfile.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block line-clamp-1">
              {schoolProfile.motto}
            </p>
          </div>
        </div>

        {/* Right Action & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Auto-Save & Real-Time Sync Status Button (Non-Ortu Only) */}
          {onOpenPublishModal && currentUser.role !== 'ortu' && (
            <button
              type="button"
              onClick={onOpenPublishModal}
              className={`relative px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                hasRemoteUpdate || autoSaveStatus === 'saving'
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-700 shadow-sm'
                  : autoSaveStatus === 'offline' || (hasPendingChanges && !serverReachable)
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title={
                databaseSyncInfo.supabaseStatus !== 'connected'
                  ? `Auto-save lokal aktif • Database Supabase perlu aktivasi tabel/izin (${databaseSyncInfo.supabaseStatus}). Klik untuk sinkronkan.`
                  : lastSyncedEvent
                  ? `Tersinkron ke Database Supabase • Update terakhir: ${lastSyncedEvent.actionLabel} oleh ${lastSyncedEvent.savedBy}`
                  : 'Tersinkron Otomatis ke Database Supabase & Real-Time Portal'
              }
            >
              {hasRemoteUpdate || autoSaveStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : autoSaveStatus === 'offline' ? (
                <Rocket className="w-4 h-4" />
              ) : realtimeConnected ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">
                {autoSaveStatus === 'saving'
                  ? 'Menyinkronkan...'
                  : hasRemoteUpdate
                  ? `Menyinkronkan v${publishMeta.publishedVersion}`
                  : autoSaveStatus === 'offline'
                  ? 'Tersimpan Lokal'
                  : databaseSyncInfo.supabaseStatus === 'connected'
                  ? `Auto-Save DB${
                      publishMeta.publishedVersion > 0
                        ? ` • v${publishMeta.publishedVersion}`
                        : localPublishedVersion > 0
                        ? ` • v${localPublishedVersion}`
                        : ''
                    }`
                  : realtimeConnected
                  ? `Real-Time Live${
                      publishMeta.publishedVersion > 0
                        ? ` • v${publishMeta.publishedVersion}`
                        : localPublishedVersion > 0
                        ? ` • v${localPublishedVersion}`
                        : ''
                    }`
                  : publishMeta.publishedVersion > 0
                  ? `Tersimpan Otomatis • v${publishMeta.publishedVersion}`
                  : localPublishedVersion > 0
                  ? `Tersimpan Otomatis • v${localPublishedVersion}`
                  : 'Tersimpan Otomatis'}
              </span>
            </button>
          )}

          {/* Read-only Real-Time Sync Indicator for Ortu */}
          {currentUser.role === 'ortu' && (
            <div
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-emerald-50 text-emerald-800 border-emerald-200"
              title={
                lastSyncedEvent
                  ? `Pembaruan real-time terakhir: ${lastSyncedEvent.actionLabel}`
                  : 'Data sekolah tersinkronisasi otomatis secara real-time'
              }
            >
              <Wifi className={`w-3.5 h-3.5 ${realtimeConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">
                {realtimeConnected ? 'Real-Time' : 'Sinkron'}
                {publishMeta.publishedVersion > 0 ? ` • v${publishMeta.publishedVersion}` : ''}
              </span>
            </div>
          )}

          {/* Share Portal Links Button (Guru, Karyawan, Ortu) */}
          {onOpenShareModal && currentUser.role !== 'ortu' && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200 transition-all cursor-pointer"
              title="Bagikan Link Akses untuk Guru, Karyawan & Orang Tua Murid"
            >
              <Share2 className="w-4 h-4 text-teal-700" />
              <span className="hidden md:inline">Link Portal</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-200"
            title="Pemberitahuan & Pengingat"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 rounded-xl transition-all text-left"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-400"
              />
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[150px]">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span
                  className={`inline-block px-1.5 py-0.2 text-[9px] font-semibold rounded border ${currentBadge.bg}`}
                >
                  {currentBadge.label}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Sedang Masuk Sebagai:
                  </p>
                  <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">{currentUser.position || currentUser.role}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">@{currentUser.username}</p>
                </div>

                <div className="pt-1 px-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setIsMyPhotoModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Ubah Foto Profil Saya
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPassMessage(null);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    Ubah Kata Sandi Saya
                  </button>
                  {currentUser.role !== 'ortu' && onNavigateToProfile && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateToProfile();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <School className="w-4 h-4 text-emerald-600" />
                      {canEditSchoolData ? 'Profil & Logo Sekolah' : 'Lihat Profil Sekolah'}
                    </button>
                  )}
                  {onOpenPublishModal && currentUser.role !== 'ortu' && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenPublishModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-amber-600" />
                        <span>Sinkronisasi &amp; Backup Data</span>
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-emerald-100 text-emerald-800">
                        {autoSaveStatus === 'saving' ? 'Menyimpan' : 'Otomatis'}
                      </span>
                    </button>
                  )}
                  {onOpenShareModal && currentUser.role !== 'ortu' && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenShareModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-teal-600" />
                      Link Akses Guru, Staf &amp; Ortu
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenLoginModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Ganti Akun / Masuk Portal
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Photo Upload Modal */}
      {isMyPhotoModalOpen && (
        <PhotoUploadModal
          isOpen={isMyPhotoModalOpen}
          onClose={() => setIsMyPhotoModalOpen(false)}
          currentPhotoUrl={currentUser.avatarUrl}
          entityName={currentUser.name}
          entityType={
            currentUser.role === 'guru'
              ? 'teacher'
              : currentUser.role === 'pegawai'
              ? 'staff'
              : currentUser.role === 'ortu'
              ? 'student'
              : 'user'
          }
          title={`Ubah Foto Profil - ${currentUser.name}`}
          onSavePhoto={(newPhotoUrl) => {
            updateUserAvatar(currentUser.id, newPhotoUrl);
          }}
        />
      )}

      {/* Self-service Change Own Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm">Ubah Kata Sandi Akun</h3>
                  <p className="text-[11px] text-emerald-200 font-mono">@{currentUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword !== confirmPassword) {
                  setPassMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
                  return;
                }
                const res = changeOwnPassword(oldPassword, newPassword);
                if (res.success) {
                  setPassMessage({ type: 'success', text: res.message });
                  setTimeout(() => {
                    setIsPasswordModalOpen(false);
                  }, 1000);
                } else {
                  setPassMessage({ type: 'error', text: res.message });
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              {passMessage && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    passMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                  }`}
                >
                  {passMessage.type === 'error' ? (
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Lama</label>
                <input
                  type={showPassFields ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type={showPassFields ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  type={showPassFields ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPassFields((prev) => !prev)}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
              >
                {showPassFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassFields ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}</span>
              </button>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
