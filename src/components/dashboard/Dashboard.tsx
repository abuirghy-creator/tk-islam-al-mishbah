import React from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  BookOpen,
  CreditCard,
  Camera,
  ScanLine,
  Compass,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  School,
  FileSpreadsheet,
  Share2
} from 'lucide-react';

interface DashboardProps {
  onNavigateTab: (tabKey: string) => void;
  onOpenShareModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onOpenShareModal }) => {
  const {
    schoolProfile,
    students,
    teachers,
    staff,
    studentAttendance,
    halaqohAssessments,
    sppInvoices,
    gallery,
    announcements,
    currentUser,
    canEditSchoolData
  } = useApp();

  const isParent = currentUser.role === 'ortu';
  const todayStr = new Date().toISOString().split('T')[0];

  if (isParent) {
    const myStudent =
      (currentUser.relatedStudentId &&
        students.find((s) => s.id === currentUser.relatedStudentId)) ||
      students[0];
    const myAttRecords = myStudent
      ? studentAttendance.filter((r) => r.studentId === myStudent.id)
      : [];
    const todayRec = myAttRecords.find((r) => r.date === todayStr);
    const presentTotal = myAttRecords.filter(
      (r) => r.status === 'Hadir' || r.status === 'Terlambat'
    ).length;
    const myHalaqohRecords = myStudent
      ? halaqohAssessments.filter((h) => h.studentId === myStudent.id)
      : [];
    const latestAnnouncement = announcements[0];

    return (
      <div className="space-y-6">
        {/* Parent Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <img
                src={myStudent?.photoUrl || schoolProfile.logoUrl || SCHOOL_ASSETS.logo}
                alt={myStudent?.name || 'Santri'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-amber-400 bg-white p-0.5 object-cover shadow-lg shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950">
                    Portal Wali Murid (Hanya Lihat)
                  </span>
                  {myStudent && (
                    <span className="text-xs text-emerald-200 font-semibold">
                      Ananda: {myStudent.name} • {myStudent.className}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans">
                  Ahlan wa Sahlan, {currentUser.name}!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
                  Pantau dokumentasi kegiatan sekolah, laporan kehadiran ananda, serta buku mutabaah Tahfidz &amp; membaca Iqro secara langsung.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Laporan Absensi Anak
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('halaqoh')}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md border border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> Buku Mutabaah
              </button>
            </div>
          </div>

          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Parent Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTab('reports')}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Absensi Anak Hari Ini
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {todayRec ? todayRec.status : 'Belum Tercatat'}
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                {todayRec
                  ? `Pukul ${todayRec.time} WIB (${todayRec.method})`
                  : `${presentTotal} hari hadir tercatat`}
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('halaqoh')}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Buku Mutabaah Anak
              </span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {myHalaqohRecords.length}
              </div>
              <div className="text-xs text-amber-700 font-semibold mt-1">
                Catatan Tahfidz &amp; Membaca Iqro
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('gallery')}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kegiatan &amp; Pengumuman
              </span>
              <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {gallery.length} Foto/Video
              </div>
              <div className="text-xs text-teal-700 font-semibold mt-1 truncate">
                {latestAnnouncement ? latestAnnouncement.title : `${announcements.length} Pengumuman`}
              </div>
            </div>
          </div>
        </div>

        {/* Parent Allowed Menu Grid */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Akses Layanan Wali Murid (Mode Pantau / Lihat Saja)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                tab: 'gallery',
                title: 'Kegiatan & Pengumuman Sekolah',
                subtitle: 'Lihat galeri foto/video kegiatan & maklumat resmi sekolah',
                icon: Sparkles,
                color: 'text-teal-700 bg-teal-50'
              },
              {
                tab: 'reports',
                title: 'Laporan Absensi Anak',
                subtitle: 'Lihat kehadiran harian, rekap bulanan & unduh PDF ananda',
                icon: FileText,
                color: 'text-rose-700 bg-rose-50'
              },
              {
                tab: 'halaqoh',
                title: 'Buku Mutabaah (Halaqoh)',
                subtitle: 'Pantau perkembangan Tahfidz & membaca Iqro + unduh PDF 2 lembar',
                icon: BookOpen,
                color: 'text-amber-700 bg-amber-50'
              }
            ].map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 flex items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStudentAtt = studentAttendance.filter((r) => r.date === todayStr);
  const presentCount = todayStudentAtt.filter((r) => r.status === 'Hadir' || r.status === 'Terlambat').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const totalSppPaid = sppInvoices
    .filter((inv) => inv.status === 'LUNAS' && inv.monthYear.includes('Oktober'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={schoolProfile.logoUrl || SCHOOL_ASSETS.logo}
              alt="Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-amber-400 bg-white p-0.5 object-cover shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-emerald-950">
                  {canEditSchoolData ? 'Akses Penuh Pemilik Akun' : 'Portal Pengisian Guru & Staf'}
                </span>
                <span className="text-xs text-emerald-200 hidden sm:inline">
                  {schoolProfile.npsn}
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans">
                Ahlan wa Sahlan, {currentUser.name}!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
                {canEditSchoolData
                  ? "Selamat datang di pusat kendali manajemen presensi, data sekolah & pembelajaran Al-Qur'an TK Islam Al Mishbah."
                  : 'Anda dapat mengisi presensi selfie guru/karyawan, absensi barcode & manual siswa, serta buku mutabaah halaqoh secara real-time.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('teacher-att')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Presensi Selfie
            </button>
            <button
              onClick={() => onNavigateTab('student-att')}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md border border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ScanLine className="w-4 h-4" /> Scan Barcode Siswa
            </button>
            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl shadow-md border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-amber-300" /> Bagikan Link Portal
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigateTab('student-att')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Presensi Siswa Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {attendanceRate}%
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              {presentCount} dari {students.length} Santri Hadir
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigateTab('halaqoh')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Setoran Tahfidz & Tajwid
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {halaqohAssessments.length}
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-1">
              Evaluasi Mutaba'ah Real-Time
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigateTab('master-data')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Civitas Sekolah
            </span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {students.length + teachers.length + staff.length}
            </div>
            <div className="text-xs text-blue-700 font-semibold mt-1">
              {teachers.length} Guru • {staff.length} Pegawai • {students.length} Siswa
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigateTab('spp')}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SPP Masuk (Oktober)
            </span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              Rp {(totalSppPaid / 1000).toLocaleString('id-ID')} rb
            </div>
            <div className="text-xs text-teal-700 font-semibold mt-1">
              Via QRIS, BSI & BCA Online
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
        <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Akses Fitur Cepat TK Al Mishbah
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              tab: 'teacher-att',
              title: 'Selfie Guru',
              subtitle: 'Kamera & GPS 150m',
              icon: Camera,
              color: 'text-emerald-700 bg-emerald-50'
            },
            {
              tab: 'student-att',
              title: 'Barcode Siswa',
              subtitle: 'Scan & Absen Manual',
              icon: ScanLine,
              color: 'text-teal-700 bg-teal-50'
            },
            {
              tab: 'gps-tracker',
              title: 'Radar Lokasi',
              subtitle: 'Safe Zone Arrival',
              icon: Compass,
              color: 'text-cyan-700 bg-cyan-50'
            },
            {
              tab: 'halaqoh',
              title: 'Buku Mutabaah',
              subtitle: 'Tahfidz & Iqro',
              icon: BookOpen,
              color: 'text-amber-700 bg-amber-50'
            },
            {
              tab: 'spp',
              title: 'SPP Online',
              subtitle: canEditSchoolData ? 'Verifikasi & Kuitansi' : 'Lihat Status & Kuitansi',
              icon: CreditCard,
              color: 'text-blue-700 bg-blue-50'
            },
            {
              tab: 'reports',
              title: 'Laporan PDF',
              subtitle: 'Harian & Bulanan',
              icon: FileText,
              color: 'text-rose-700 bg-rose-50'
            },
            {
              tab: 'school-profile',
              title: 'Profil Sekolah',
              subtitle: canEditSchoolData ? 'Edit Logo & Motto' : 'Hanya Lihat',
              icon: School,
              color: 'text-emerald-800 bg-emerald-100'
            },
            {
              tab: 'master-data',
              title: 'Data Sekolah',
              subtitle: canEditSchoolData ? 'Edit & Upload Excel' : 'Lihat Data & QR',
              icon: FileSpreadsheet,
              color: 'text-teal-700 bg-teal-50'
            }
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => onNavigateTab(item.tab)}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
