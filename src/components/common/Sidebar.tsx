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
  School
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { currentUser, leaveRequests } = useApp();
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard & Beranda',
      icon: LayoutDashboard,
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'teacher-att',
      label: 'Presensi & Cuti Guru/Staf',
      icon: Camera,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Butuh ACC` : 'ACC Kepsek',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'student-att',
      label: 'Presensi Scan Siswa',
      icon: ScanLine,
      badge: 'Barcode Real-time',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'gps-tracker',
      label: 'Pelacakan Lokasi GPS',
      icon: Navigation,
      badge: 'Safe Zone',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'master-data',
      label: 'Data Guru, Staf & Murid',
      icon: Users,
      badge: 'CRUD',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'halaqoh',
      label: 'Halaqoh Tahfidz Cilik',
      icon: BookOpen,
      badge: '3 Pilar Nilai',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'reports',
      label: 'Laporan Presensi (PDF/XLS)',
      icon: FileText,
      badge: 'Download',
      roles: ['guru', 'pegawai', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'spp',
      label: 'Pembayaran SPP Online',
      icon: CreditCard,
      badge: 'QRIS/BSI',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'chat',
      label: 'Chat Ortu & Guru',
      icon: MessageSquare,
      badge: 'Grup & Pribadi',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'gallery',
      label: 'Galeri & Pengumuman',
      icon: Image,
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    },
    {
      key: 'school-profile',
      label: 'Profil & Logo Sekolah',
      icon: School,
      badge: 'Motto/Logo',
      roles: ['guru', 'pegawai', 'ortu', 'admin', 'kepala_sekolah', 'owner']
    }
  ];

  const visibleItems = navItems.filter((item) =>
    currentUser.role === 'owner' ||
    currentUser.role === 'kepala_sekolah' ||
    currentUser.role === 'admin' ||
    item.roles.includes(currentUser.role)
  );

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
            Menu Utama Aplikasi
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
