import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LoginModal, LoginScreen } from './components/auth/LoginModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { TeacherSelfieAttendance } from './components/attendance/TeacherSelfieAttendance';
import { StudentAttendance } from './components/attendance/StudentAttendance';
import { LocationTracker } from './components/attendance/LocationTracker';
import { MasterDataManagement } from './components/master/MasterDataManagement';
import { HalaqohTahfidz } from './components/halaqoh/HalaqohTahfidz';
import { AttendanceReports } from './components/reports/AttendanceReports';
import { SppPayment } from './components/spp/SppPayment';
import { ParentTeacherChat } from './components/chat/ParentTeacherChat';
import { SchoolGallery } from './components/gallery/SchoolGallery';
import { SchoolProfileView } from './components/profile/SchoolProfileView';
import { PublishManagerModal } from './components/publish/PublishManagerModal';
import { PortalShareModal } from './components/publish/PortalShareModal';
import { SCHOOL_ASSETS } from './assets/images';
import { Menu, Home, ArrowLeft, ChevronRight } from 'lucide-react';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Beranda',
  'teacher-att': 'Presensi & Cuti Guru/Staf',
  'student-att': 'Presensi Scan Siswa',
  'gps-tracker': 'Pelacakan Lokasi GPS',
  'master-data': 'Data Guru, Staf & Murid',
  halaqoh: 'Halaqoh Tahfidz Cilik',
  reports: 'Laporan Presensi (PDF/XLS)',
  spp: 'Pembayaran SPP Online',
  chat: 'Chat Ortu & Guru',
  gallery: 'Galeri & Pengumuman',
  'school-profile': 'Profil & Logo Sekolah'
};

const ORTU_ALLOWED_TABS = new Set(['dashboard', 'gallery', 'reports', 'halaqoh']);

const AppContent: React.FC = () => {
  const { schoolProfile, isAuthenticated, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isSharePortalModalOpen, setIsSharePortalModalOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  const isParent = currentUser.role === 'ortu';

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    if (isParent) {
      if (!ORTU_ALLOWED_TABS.has(activeTab)) {
        setActiveTab('dashboard');
      }
      setIsPublishModalOpen(false);
      setIsSharePortalModalOpen(false);
    }
  }, [isParent, currentUser.id, activeTab]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const navigateTab = (tab: string) => {
    if (isParent && !ORTU_ALLOWED_TABS.has(tab)) {
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tab);
  };

  const goToHome = () => {
    setActiveTab('dashboard');
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effectiveTab = isParent && !ORTU_ALLOWED_TABS.has(activeTab) ? 'dashboard' : activeTab;
  const currentTabLabel = TAB_LABELS[effectiveTab] || effectiveTab.replace('-', ' ');

  const renderActiveView = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateTab={navigateTab}
            onOpenShareModal={isParent ? undefined : () => setIsSharePortalModalOpen(true)}
          />
        );
      case 'teacher-att':
        return <TeacherSelfieAttendance />;
      case 'student-att':
        return <StudentAttendance />;
      case 'gps-tracker':
        return <LocationTracker />;
      case 'master-data':
        return <MasterDataManagement />;
      case 'halaqoh':
        return <HalaqohTahfidz />;
      case 'reports':
        return <AttendanceReports />;
      case 'spp':
        return <SppPayment />;
      case 'chat':
        return <ParentTeacherChat />;
      case 'gallery':
        return <SchoolGallery />;
      case 'school-profile':
        return <SchoolProfileView onOpenPublishModal={() => setIsPublishModalOpen(true)} />;
      default:
        return (
          <Dashboard
            onNavigateTab={navigateTab}
            onOpenShareModal={isParent ? undefined : () => setIsSharePortalModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onNavigateToProfile={isParent ? goToHome : () => navigateTab('school-profile')}
        onOpenPublishModal={isParent ? undefined : () => setIsPublishModalOpen(true)}
        onOpenShareModal={isParent ? undefined : () => setIsSharePortalModalOpen(true)}
      />

      {/* Mobile Subheader Bar for Navigation Drawer */}
      <div className="lg:hidden bg-emerald-800 text-white px-4 py-2 flex items-center justify-between gap-2 border-b border-emerald-700">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-xs font-bold bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-600/50 cursor-pointer"
        >
          <Menu className="w-4 h-4 text-amber-300" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {effectiveTab !== 'dashboard' ? (
            <button
              type="button"
              onClick={goToHome}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-emerald-950 px-3 py-1.5 rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-200 truncate">
              Beranda
            </span>
          )}
        </div>
      </div>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={effectiveTab}
          onSelectTab={navigateTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenPublishModal={isParent ? undefined : () => setIsPublishModalOpen(true)}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {effectiveTab !== 'dashboard' && (
            <div className="mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-3 bg-white border border-emerald-100 rounded-2xl px-4 py-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <button
                  type="button"
                  onClick={goToHome}
                  className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-800 truncate">
                  {currentTabLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={goToHome}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
                <Home className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          )}

          {renderActiveView()}

          {effectiveTab !== 'dashboard' && (
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex justify-start">
              <button
                type="button"
                onClick={goToHome}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <Home className="w-4 h-4 text-emerald-700" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={schoolProfile.logoUrl || SCHOOL_ASSETS.logo}
              alt=""
              className="w-8 h-8 rounded-full border border-emerald-500 object-cover"
            />
            <div className="text-left">
              <div className="font-bold text-slate-800">{schoolProfile.name}</div>
              <div className="text-[10px] text-slate-400">{schoolProfile.npsn}</div>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            <p>© 2026 TK Islam Al Mishbah. Seluruh Hak Cipta Dilindungi.</p>
            <p className="mt-0.5">Sistem Absensi Selfie, Scan Barcode, Halaqoh Tahfidz & Keuangan SPP Real-Time</p>
          </div>
        </div>
      </footer>

      {/* Notification Drawer Modal */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={navigateTab}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Update & Publish Modal (Hanya Non-Ortu) */}
      {!isParent && (
        <PublishManagerModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onFinishToHome={() => {
            setIsPublishModalOpen(false);
            setActiveTab('dashboard');
            setIsMobileSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Portal Share Links & User Credentials Modal (Hanya Non-Ortu) */}
      {!isParent && (
        <PortalShareModal
          isOpen={isSharePortalModalOpen}
          onClose={() => setIsSharePortalModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
