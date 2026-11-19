import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Camera,
  ScanLine,
  Navigation,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  MessageSquare,
  Image,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  School,
  Rocket,
  Clock,
  ClipboardCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenPublishModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenPublishModal
}) => {
  const {
    currentUser,
    leaveRequests,
    canEditSchoolData,
    hasPendingChanges,
    hasRemoteUpdate,
    publishMeta,
    autoSaveStatus,
    realtimeConnected
  } = useApp();
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const isParent = currentUser.role === 'ortu';

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard & Beranda',
      icon: LayoutDashboard,
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'attendance-hub',
      label: 'Absensi Murid & Guru',
      icon: ClipboardCheck,
      badge: 'Terpadu',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'student-att',
      label: 'Absensi Murid (Scan)',
      icon: ScanLine,
      badge: 'Barcode & Manual',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'teacher-att',
      label: 'Absensi & Cuti Guru/Staf',
      icon: Camera,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Butuh ACC` : 'ACC Pemilik',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'schedule-guru',
      label: 'Jadwal Guru',
      icon: Clock,
      badge: "Senin–Jum'at",
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'schedule-karyawan',
      label: 'Jadwal Karyawan',
      icon: Clock,
      badge: "Senin–Jum'at",
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'gps-tracker',
      label: 'Pelacakan Lokasi GPS',
      icon: Navigation,
      badge: 'Safe Zone',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'master-data',
      label: 'Data Guru, Staf & Murid',
      icon: Users,
      badge: canEditSchoolData ? 'Kelola Data' : 'Lihat Data',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'halaqoh',
      label: isParent ? 'Buku Mutabaah (Halaqoh)' : 'Halaqoh Tahfidz & Iqro',
      icon: BookOpen,
      badge: isParent ? 'Pantau Anak' : 'Tahfidz & Iqro',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'reports',
      label: isParent ? 'Laporan Absensi Anak' : 'Laporan Presensi (PDF/XLS)',
      icon: FileText,
      badge: isParent ? 'Lihat & PDF' : 'Download',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'spp',
      label: 'Pembayaran SPP Online',
      icon: CreditCard,
      badge: 'QRIS/BSI',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'chat',
      label: 'Chat Ortu & Guru',
      icon: MessageSquare,
      badge: 'Grup & Pribadi',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'gallery',
      label: isParent ? 'Kegiatan & Pengumuman' : 'Galeri & Pengumuman',
      icon: Image,
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'school-profile',
      label: 'Profil & Logo Sekolah',
      icon: School,
      badge: canEditSchoolData ? 'Edit Profil' : 'Lihat',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    }
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-[69px] left-0 h-[calc(100vh-69px)] w-64 bg-white border-r border-slate-200 z-30 flex flex-col justify-between transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isParent ? 'Menu Portal Wali Murid' : 'Menu Utama Aplikasi'}
          </div>

          {visibleItems.map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left group ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-emerald-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-1 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Auto-Save & Sync Quick Card (Non-Ortu Only) */}
        {!isParent && onOpenPublishModal && (canEditSchoolData || hasRemoteUpdate || publishMeta.publishedVersion > 0) && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={() => {
                onOpenPublishModal();
                onCloseMobile();
              }}
              className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                hasRemoteUpdate || autoSaveStatus === 'saving'
                  ? 'bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100'
                  : autoSaveStatus === 'offline' || hasPendingChanges
                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Rocket className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold truncate">
                    {autoSaveStatus === 'saving'
                      ? 'Menyimpan Otomatis...'
                      : hasRemoteUpdate
                      ? `Update Otomatis v${publishMeta.publishedVersion}`
                      : autoSaveStatus === 'offline'
                      ? 'Tersimpan di Lokal'
                      : realtimeConnected
                      ? 'Real-Time Portal Aktif'
                      : 'Tersimpan Otomatis'}
                  </div>
                  <div className="text-[9px] opacity-75 truncate">
                    {publishMeta.publishedVersion > 0
                      ? `Live v${publishMeta.publishedVersion} • ${realtimeConnected ? 'Real-Time Sync' : 'Auto-Sync Aktif'}`
                      : realtimeConnected
                      ? 'WebSocket Real-Time Aktif'
                      : 'Auto-Save & Auto-Update Aktif'}
                  </div>
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 ${
                  autoSaveStatus === 'saving'
                    ? 'bg-sky-200 text-sky-900'
                    : autoSaveStatus === 'offline'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {autoSaveStatus === 'saving'
                  ? 'Sync'
                  : autoSaveStatus === 'offline'
                  ? 'Lokal'
                  : realtimeConnected
                  ? 'Live'
                  : 'Auto'}
              </span>
            </button>
          </div>
        )}

        {/* Bottom Current Profile Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-emerald-400 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium capitalize truncate">
                {currentUser.position || currentUser.role}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
