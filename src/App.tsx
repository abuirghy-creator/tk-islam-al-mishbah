import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { LoginModal } from './components/auth/LoginModal';
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
import { SCHOOL_ASSETS } from './assets/images';
import { Menu, Sparkles, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { schoolProfile } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateTab={(tab) => setActiveTab(tab)} />;
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
        return <SchoolProfileView />;
      default:
        return <Dashboard onNavigateTab={(tab) => setActiveTab(tab)} />;
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
        onNavigateToProfile={() => setActiveTab('school-profile')}
      />

      {/* Mobile Subheader Bar for Navigation Drawer */}
      <div className="lg:hidden bg-emerald-800 text-white px-4 py-2 flex items-center justify-between border-b border-emerald-700">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-xs font-bold bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-600/50"
        >
          <Menu className="w-4 h-4 text-amber-300" />
          <span>Menu Navigasi</span>
        </button>
        <span className="text-xs font-semibold text-emerald-200 capitalize">
          {activeTab.replace('-', ' ')}
        </span>
      </div>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderActiveView()}
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
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
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
