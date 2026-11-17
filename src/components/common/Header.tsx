import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import { Bell, LogOut, ShieldCheck, ChevronDown, Clock, MapPin, Sparkles, School, Camera } from 'lucide-react';
import { PhotoUploadModal } from './PhotoUploadModal';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
  onNavigateToProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenLoginModal, onNavigateToProfile }) => {
  const {
    currentUser,
    users,
    quickSwitchUser,
    logout,
    notifications,
    schoolProfile,
    updateUserAvatar,
    showDemoSwitcher,
    toggleDemoSwitcher
  } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMyPhotoModalOpen, setIsMyPhotoModalOpen] = useState(false);
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
            Sistem Informasi Terpadu TK Al Mishbah • Real-Time Database Aktif
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
          title="Klik untuk membuka Pengaturan Profil & Logo Sekolah"
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
                      onNavigateToProfile?.();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <School className="w-4 h-4 text-emerald-600" />
                    Profil & Logo Sekolah
                  </button>
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
    </header>
  );
};
