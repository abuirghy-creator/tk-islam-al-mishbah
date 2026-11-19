import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  BarChart3,
  Users,
  GraduationCap,
  MapPin,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  exportDailyAttendancePDF,
  exportMonthlyAttendancePDF,
  exportDailyTeacherAttendancePDF,
  exportMonthlyTeacherAttendancePDF
} from '../../services/pdfService';
import {
  exportDailyAttendanceExcel,
  exportMonthlyAttendanceExcel,
  exportDailyTeacherAttendanceExcel,
  exportMonthlyTeacherAttendanceExcel
} from '../../services/excelService';
import { TeacherAttendanceRecord } from '../../types';
import { getScheduleForDate } from '../../utils/workSchedule';

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const formatMonthLabel = (yearMonth: string): string => {
  const [y, m] = yearMonth.split('-');
  const mIdx = Number(m) - 1;
  if (!y || isNaN(mIdx) || mIdx < 0 || mIdx > 11) return yearMonth;
  return `${INDONESIAN_MONTHS[mIdx]} ${y}`;
};

interface PersonnelRow {
  id: string;
  code: string;
  name: string;
  category: 'Guru' | 'Karyawan';
  roleLabel: string;
  photoUrl: string;
}

export const AttendanceReports: React.FC = () => {
  const {
    schoolProfile,
    students,
    studentAttendance,
    teachers,
    staff,
    teacherAttendance,
    upsertTeacherAttendance,
    canManageMasterData,
    currentUser
  } = useApp();

  const isParent = currentUser.role === 'ortu';
  const myStudent = useMemo(() => {
    if (!isParent) return null;
    if (currentUser.relatedStudentId) {
      return students.find((s) => s.id === currentUser.relatedStudentId) || students[0] || null;
    }
    return students[0] || null;
  }, [isParent, currentUser.relatedStudentId, students]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.slice(0, 7);

  const [reportSubject, setReportSubject] = useState<'teacher' | 'student'>(
    isParent ? 'student' : 'teacher'
  );
  const [personnelCategory, setPersonnelCategory] = useState<'all' | 'teacher' | 'staff'>('all');
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [selectedPersonnelDetailId, setSelectedPersonnelDetailId] = useState<string>('');

  const selectedDateGuruSchedule = getScheduleForDate(schoolProfile.workSchedule, 'guru', selectedDate);
  const selectedDateStaffSchedule = getScheduleForDate(schoolProfile.workSchedule, 'karyawan', selectedDate);

  useEffect(() => {
    if (isParent) {
      setReportSubject('student');
    }
  }, [isParent]);

  const effectiveSubject: 'teacher' | 'student' = isParent ? 'student' : reportSubject;

  const classList = ['TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'];

  // Combined personnel list (Guru + Karyawan) filtered by personnelCategory
  const activeTeachersForExport = useMemo(
    () => (personnelCategory === 'staff' ? [] : teachers),
    [personnelCategory, teachers]
  );
  const activeStaffForExport = useMemo(
    () => (personnelCategory === 'teacher' ? [] : staff),
    [personnelCategory, staff]
  );
  const activeCategoryLabel =
    personnelCategory === 'teacher'
      ? 'Guru'
      : personnelCategory === 'staff'
      ? 'Karyawan'
      : 'Guru & Karyawan';

  const personnelList = useMemo<PersonnelRow[]>(() => {
    const list: PersonnelRow[] = [];
    if (personnelCategory === 'all' || personnelCategory === 'teacher') {
      teachers.forEach((t) => {
        list.push({
          id: t.id,
          code: t.nuptk || t.id,
          name: t.name,
          category: 'Guru',
          roleLabel: t.assignedDuty || t.position,
          photoUrl: t.photoUrl
        });
      });
    }
    if (personnelCategory === 'all' || personnelCategory === 'staff') {
      staff.forEach((s) => {
        list.push({
          id: s.id,
          code: s.nip || s.id,
          name: s.name,
          category: 'Karyawan',
          roleLabel: `${s.position} (${s.department})`,
          photoUrl: s.photoUrl
        });
      });
    }
    return list;
  }, [teachers, staff, personnelCategory]);

  // Build dynamic month options (last 6 months + any months present in data)
  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keys.add(ym);
    }
    teacherAttendance.forEach((r) => {
      if (r.date && r.date.length >= 7) keys.add(r.date.slice(0, 7));
    });
    studentAttendance.forEach((r) => {
      if (r.date && r.date.length >= 7) keys.add(r.date.slice(0, 7));
    });
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({ key, label: formatMonthLabel(key) }));
  }, [teacherAttendance, studentAttendance]);

  const selectedMonthLabel = formatMonthLabel(selectedMonthKey);

  // ==================== GURU & KARYAWAN DAILY & MONTHLY COMPUTATIONS ====================
  const personnelDayRecords = useMemo(
    () => teacherAttendance.filter((r) => r.date === selectedDate),
    [teacherAttendance, selectedDate]
  );

  const personnelDailyRows = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return personnelList
      .map((person) => {
        const record = personnelDayRecords.find((r) => r.teacherId === person.id);
        return { person, record };
      })
      .filter(({ person, record }) => {
        const matchSearch =
          !q ||
          person.name.toLowerCase().includes(q) ||
          person.code.toLowerCase().includes(q) ||
          person.roleLabel.toLowerCase().includes(q) ||
          person.category.toLowerCase().includes(q);
        const currentStatus = record ? record.status : 'Belum Presensi';
        const matchStatus = !teacherStatusFilter || currentStatus === teacherStatusFilter;
        return matchSearch && matchStatus;
      });
  }, [personnelList, personnelDayRecords, teacherSearch, teacherStatusFilter]);

  const personnelDailyStats = useMemo(() => {
    const total = personnelList.length;
    let tepatWaktu = 0;
    let terlambat = 0;
    let izinSakitCuti = 0;
    let belumPresensi = 0;

    personnelList.forEach((p) => {
      const rec = personnelDayRecords.find((r) => r.teacherId === p.id);
      if (!rec) {
        belumPresensi++;
      } else if (rec.status === 'Hadir Tepat Waktu') {
        tepatWaktu++;
      } else if (rec.status === 'Terlambat') {
        terlambat++;
      } else {
        izinSakitCuti++;
      }
    });

    const hadirPct = total > 0 ? Math.round(((tepatWaktu + terlambat) / total) * 100) : 0;
    return { total, tepatWaktu, terlambat, izinSakitCuti, belumPresensi, hadirPct };
  }, [personnelList, personnelDayRecords]);

  const personnelIdsSet = useMemo(() => new Set(personnelList.map((p) => p.id)), [personnelList]);

  const personnelMonthRecords = useMemo(
    () =>
      teacherAttendance.filter(
        (r) => r.date.startsWith(selectedMonthKey) && personnelIdsSet.has(r.teacherId)
      ),
    [teacherAttendance, selectedMonthKey, personnelIdsSet]
  );

  const activeDaysInMonth = useMemo(
    () => new Set(personnelMonthRecords.map((r) => r.date)).size,
    [personnelMonthRecords]
  );

  const personnelMonthlySummary = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return personnelList
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.roleLabel.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .map((person) => {
        const recs = personnelMonthRecords.filter((r) => r.teacherId === person.id);
        const tepatWaktu = recs.filter((r) => r.status === 'Hadir Tepat Waktu').length;
        const terlambat = recs.filter((r) => r.status === 'Terlambat').length;
        const izin = recs.filter((r) => r.status === 'Izin').length;
        const sakit = recs.filter((r) => r.status === 'Sakit').length;
        const cuti = recs.filter((r) => r.status === 'Cuti').length;
        const totalRecorded = recs.length;
        const denominator = Math.max(activeDaysInMonth, totalRecorded, 1);
        const percentage = Math.min(100, Math.round(((tepatWaktu + terlambat) / denominator) * 100));
        return {
          person,
          tepatWaktu,
          terlambat,
          izin,
          sakit,
          cuti,
          totalRecorded,
          percentage
        };
      });
  }, [personnelList, personnelMonthRecords, activeDaysInMonth, teacherSearch]);

  const personnelMonthlyStats = useMemo(() => {
    const sumTepat = personnelMonthlySummary.reduce((acc, s) => acc + s.tepatWaktu, 0);
    const sumTelat = personnelMonthlySummary.reduce((acc, s) => acc + s.terlambat, 0);
    const sumIzinSakitCuti = personnelMonthlySummary.reduce(
      (acc, s) => acc + s.izin + s.sakit + s.cuti,
      0
    );
    const avgPct =
      personnelMonthlySummary.length > 0
        ? Math.round(
            personnelMonthlySummary.reduce((acc, s) => acc + s.percentage, 0) /
              personnelMonthlySummary.length
          )
        : 0;
    return {
      avgPct,
      sumTepat,
      sumTelat,
      sumIzinSakitCuti,
      activeDays: activeDaysInMonth
    };
  }, [personnelMonthlySummary, activeDaysInMonth]);

  const selectedPersonnelMonthLogs = useMemo(() => {
    const logs = personnelMonthRecords.filter(
      (r) => !selectedPersonnelDetailId || r.teacherId === selectedPersonnelDetailId
    );
    return [...logs].sort((a, b) => b.date.localeCompare(a.date));
  }, [personnelMonthRecords, selectedPersonnelDetailId]);

  // ==================== STUDENT DAILY & MONTHLY COMPUTATIONS ====================
  const scopedStudents = useMemo(
    () => (isParent ? (myStudent ? [myStudent] : []) : students),
    [isParent, myStudent, students]
  );

  const scopedStudentAttendance = useMemo(
    () =>
      isParent
        ? myStudent
          ? studentAttendance.filter((r) => r.studentId === myStudent.id)
          : []
        : studentAttendance,
    [isParent, myStudent, studentAttendance]
  );

  const classStudents = isParent
    ? scopedStudents
    : scopedStudents.filter((s) => !selectedClass || s.className === selectedClass);

  const studentDailyFiltered = scopedStudentAttendance.filter((r) => {
    const matchDate = r.date === selectedDate;
    const matchClass = isParent || !selectedClass || r.className === selectedClass;
    return matchDate && matchClass;
  });

  const studentMonthFiltered = scopedStudentAttendance.filter((r) => {
    const matchMonth = r.date.startsWith(selectedMonthKey);
    const matchClass = isParent || !selectedClass || r.className === selectedClass;
    return matchMonth && matchClass;
  });

  const studentHadirCount =
    reportType === 'daily'
      ? studentDailyFiltered.filter((r) => r.status === 'Hadir').length
      : studentMonthFiltered.filter((r) => r.status === 'Hadir').length;
  const studentTerlambatCount =
    reportType === 'daily'
      ? studentDailyFiltered.filter((r) => r.status === 'Terlambat').length
      : studentMonthFiltered.filter((r) => r.status === 'Terlambat').length;
  const studentIzinSakitCount =
    reportType === 'daily'
      ? studentDailyFiltered.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length
      : studentMonthFiltered.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;
  const studentAlpaCount =
    reportType === 'daily'
      ? studentDailyFiltered.filter((r) => r.status === 'Alpa').length
      : studentMonthFiltered.filter((r) => r.status === 'Alpa').length;

  const studentAttendanceRate =
    reportType === 'daily'
      ? classStudents.length > 0
        ? Math.min(
            100,
            Math.round(((studentHadirCount + studentTerlambatCount) / classStudents.length) * 100)
          )
        : 0
      : studentMonthFiltered.length > 0
      ? Math.min(
          100,
          Math.round(
            ((studentHadirCount + studentTerlambatCount) / studentMonthFiltered.length) * 100
          )
        )
      : 0;

  // Export Handlers
  const handleDownloadPDF = () => {
    if (effectiveSubject === 'teacher') {
      if (reportType === 'daily') {
        exportDailyTeacherAttendancePDF(
          selectedDate,
          teacherAttendance,
          activeTeachersForExport,
          activeStaffForExport,
          activeCategoryLabel
        );
      } else {
        exportMonthlyTeacherAttendancePDF(
          selectedMonthLabel,
          selectedMonthKey,
          activeTeachersForExport,
          teacherAttendance,
          activeStaffForExport,
          activeCategoryLabel
        );
      }
      return;
    }

    const exportClassLabel = isParent ? myStudent?.className || '' : selectedClass;
    if (reportType === 'daily') {
      exportDailyAttendancePDF(selectedDate, exportClassLabel, studentDailyFiltered, scopedStudents);
    } else {
      exportMonthlyAttendancePDF(
        selectedMonthLabel,
        exportClassLabel,
        classStudents,
        isParent
          ? studentMonthFiltered
          : studentMonthFiltered.length > 0
          ? studentMonthFiltered
          : scopedStudentAttendance
      );
    }
  };

  const handleDownloadExcel = () => {
    if (effectiveSubject === 'teacher') {
      if (reportType === 'daily') {
        exportDailyTeacherAttendanceExcel(
          selectedDate,
          teacherAttendance,
          activeTeachersForExport,
          activeStaffForExport,
          activeCategoryLabel
        );
      } else {
        exportMonthlyTeacherAttendanceExcel(
          selectedMonthLabel,
          selectedMonthKey,
          activeTeachersForExport,
          teacherAttendance,
          activeStaffForExport,
          activeCategoryLabel
        );
      }
      return;
    }

    const exportClassLabel = isParent ? myStudent?.className || '' : selectedClass;
    if (reportType === 'daily') {
      exportDailyAttendanceExcel(selectedDate, exportClassLabel, studentDailyFiltered, scopedStudents);
    } else {
      exportMonthlyAttendanceExcel(
        selectedMonthLabel,
        exportClassLabel,
        classStudents,
        isParent
          ? studentMonthFiltered
          : studentMonthFiltered.length > 0
          ? studentMonthFiltered
          : scopedStudentAttendance
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-emerald-200">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              Pusat Pelaporan & Rekapitulasi Presensi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {isParent
              ? `Laporan Absensi Ananda${myStudent ? ` — ${myStudent.name}` : ''}`
              : effectiveSubject === 'teacher'
              ? 'Laporan Absensi Harian & Bulanan Guru dan Karyawan'
              : 'Laporan Kehadiran Santri Harian & Bulanan'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            {isParent
              ? 'Pantau catatan kehadiran harian maupun rekap bulanan ananda secara real-time, serta unduh laporan resmi format PDF atau Excel.'
              : 'Pantau catatan presensi harian, rekap akumulasi bulanan seluruh pendidik & tenaga kependidikan, serta unduh laporan resmi format PDF atau Excel.'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Unduh Format PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Format Excel
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-5">
        {/* Top Row: Subject Switcher & Period Mode */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Switcher */}
            {!isParent ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-200">
                <button
                  type="button"
                  onClick={() => setReportSubject('teacher')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    effectiveSubject === 'teacher'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Guru & Karyawan ({teachers.length + staff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportSubject('student')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    effectiveSubject === 'student'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Santri ({students.length})
                </button>
              </div>
            ) : (
              myStudent && (
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>
                    Ananda: {myStudent.name} ({myStudent.className})
                  </span>
                </div>
              )
            )}

            {/* Daily / Monthly Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setReportType('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportType === 'daily'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                Laporan Harian
              </button>
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  reportType === 'monthly'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Laporan Bulanan
              </button>
            </div>
          </div>

          {/* Date / Month / Search / Category Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {reportType === 'daily' ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none"
                >
                  {monthOptions.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {effectiveSubject === 'teacher' ? (
              <>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Cari nama / NUPTK / NIP..."
                    className="bg-transparent font-medium text-slate-700 focus:outline-none w-40"
                  />
                </div>
                {reportType === 'daily' && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={teacherStatusFilter}
                      onChange={(e) => setTeacherStatusFilter(e.target.value)}
                      className="bg-transparent font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="">Semua Status</option>
                      <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                      <option value="Terlambat">Terlambat</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Cuti">Cuti</option>
                      <option value="Belum Presensi">Belum Presensi</option>
                    </select>
                  </div>
                )}
              </>
            ) : !isParent ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {/* Category Filter Strip for Guru & Karyawan */}
        {effectiveSubject === 'teacher' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Kategori Pegawai:
              </span>
              <button
                type="button"
                onClick={() => {
                  setPersonnelCategory('all');
                  setSelectedPersonnelDetailId('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  personnelCategory === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua ({teachers.length + staff.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersonnelCategory('teacher');
                  setSelectedPersonnelDetailId('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  personnelCategory === 'teacher'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Guru / Pendidik ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersonnelCategory('staff');
                  setSelectedPersonnelDetailId('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  personnelCategory === 'staff'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Karyawan / Staf ({staff.length})
              </button>
            </div>
            <span className="text-[11px] text-slate-500">
              Cakupan Ekspor: <strong className="text-slate-800">{activeCategoryLabel}</strong>
            </span>
          </div>
        )}

        {/* ==================== VIEW A: ABSENSI GURU & KARYAWAN ==================== */}
        {effectiveSubject === 'teacher' && (
          <>
            {reportType === 'daily' ? (
              <>
                {/* Daily KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      % Kehadiran
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
                      {personnelDailyStats.hadirPct}%
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Dari {personnelDailyStats.total} {activeCategoryLabel}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-teal-700 block">
                      Hadir Tepat Waktu
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-teal-950 mt-1 block">
                      {personnelDailyStats.tepatWaktu}
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium">
                      Guru ≤ {selectedDateGuruSchedule.checkIn} • Staf ≤ {selectedDateStaffSchedule.checkIn}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Terlambat
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-950 mt-1 block">
                      {personnelDailyStats.terlambat}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Lewat Jadwal {selectedDateGuruSchedule.dayLabel}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">
                      Izin / Sakit / Cuti
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-blue-950 mt-1 block">
                      {personnelDailyStats.izinSakitCuti}
                    </span>
                    <span className="text-[10px] text-blue-700 font-medium">Terjadwal / ACC</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">
                      Belum Presensi
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-rose-950 mt-1 block">
                      {personnelDailyStats.belumPresensi}
                    </span>
                    <span className="text-[10px] text-rose-700 font-medium">Belum Tercatat</span>
                  </div>
                </div>

                {/* Daily Table */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Laporan Absensi Harian {activeCategoryLabel} (Tanggal: {selectedDate})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {canManageMasterData
                        ? 'Ubah pilihan di kolom Aksi untuk mencatat/memperbarui status absensi harian.'
                        : `${personnelDailyRows.length} Data ditampilkan`}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Pegawai & NUPTK/NIP</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Jabatan / Unit</th>
                          <th className="py-3 px-4">Jam Masuk</th>
                          <th className="py-3 px-4">Jam Keluar</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Lokasi GPS</th>
                          <th className="py-3 px-4">Keterangan</th>
                          {canManageMasterData && <th className="py-3 px-4 text-right">Input / Ubah</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {personnelDailyRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={canManageMasterData ? 10 : 9}
                              className="py-8 text-center text-slate-400"
                            >
                              Tidak ada data guru/karyawan yang sesuai dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          personnelDailyRows.map(({ person, record }, idx) => (
                            <tr key={person.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={record?.selfieUrl || person.photoUrl}
                                    alt={person.name}
                                    className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-800">{person.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {person.code}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    person.category === 'Guru'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                                  }`}
                                >
                                  {person.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700 font-medium">
                                {person.roleLabel}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {record ? `${record.time} WIB` : '-'}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {record?.checkOutTime ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      record.checkOutEarly
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-sky-100 text-sky-800'
                                    }`}
                                  >
                                    {record.checkOutTime} WIB
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 ${
                                    !record
                                      ? 'bg-slate-100 text-slate-600'
                                      : record.status === 'Hadir Tepat Waktu'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : record.status === 'Terlambat'
                                      ? 'bg-amber-100 text-amber-800'
                                      : record.status === 'Sakit'
                                      ? 'bg-rose-100 text-rose-800'
                                      : record.status === 'Cuti'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {record ? record.status : 'Belum Presensi'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500">
                                {record?.location ? (
                                  <span className="inline-flex items-center gap-1 text-[11px]">
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    {record.location.inRadius
                                      ? `Valid (${record.location.distanceMeters}m)`
                                      : `Luar (${record.location.distanceMeters}m)`}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                {record?.notes || '-'}
                              </td>
                              {canManageMasterData && (
                                <td className="py-3 px-4 text-right">
                                  <select
                                    value={record?.status || ''}
                                    onChange={(e) => {
                                      const val = e.target.value as TeacherAttendanceRecord['status'];
                                      if (!val) return;
                                      upsertTeacherAttendance(person.id, selectedDate, val);
                                    }}
                                    className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-emerald-600"
                                  >
                                    <option value="">-- Catat Status --</option>
                                    <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Cuti">Cuti</option>
                                  </select>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Monthly KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Rata-Rata Hadir
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
                      {personnelMonthlyStats.avgPct}%
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {activeCategoryLabel}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-teal-700 block">
                      Total Tepat Waktu
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-teal-950 mt-1 block">
                      {personnelMonthlyStats.sumTepat}
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium">Sesuai Jadwal Masuk</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      Total Terlambat
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-950 mt-1 block">
                      {personnelMonthlyStats.sumTelat}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Lewat Jadwal Masuk</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">
                      Izin / Sakit / Cuti
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-blue-950 mt-1 block">
                      {personnelMonthlyStats.sumIzinSakitCuti}
                    </span>
                    <span className="text-[10px] text-blue-700 font-medium">Hari Tidak Masuk</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">
                      Hari Kerja Tercatat
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                      {personnelMonthlyStats.activeDays}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{selectedMonthLabel}</span>
                  </div>
                </div>

                {/* Monthly Recap Table */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Rekapitulasi Absensi Bulanan {activeCategoryLabel} ({selectedMonthLabel})
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Klik baris pegawai untuk melihat rincian log harian
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3 text-center">No</th>
                          <th className="py-3 px-4">Nama Pegawai & NUPTK/NIP</th>
                          <th className="py-3 px-3">Kategori</th>
                          <th className="py-3 px-4">Jabatan / Unit</th>
                          <th className="py-3 px-3 text-center">Tepat Waktu</th>
                          <th className="py-3 px-3 text-center">Terlambat</th>
                          <th className="py-3 px-3 text-center">Izin</th>
                          <th className="py-3 px-3 text-center">Sakit</th>
                          <th className="py-3 px-3 text-center">Cuti</th>
                          <th className="py-3 px-3 text-center">Total Hari</th>
                          <th className="py-3 px-3 text-center">% Hadir</th>
                          <th className="py-3 px-4 text-center">Predikat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {personnelMonthlySummary.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-8 text-center text-slate-400">
                              Tidak ada data guru/karyawan untuk bulan {selectedMonthLabel}.
                            </td>
                          </tr>
                        ) : (
                          personnelMonthlySummary.map((row, idx) => {
                            const isSelected = selectedPersonnelDetailId === row.person.id;
                            return (
                              <tr
                                key={row.person.id}
                                onClick={() =>
                                  setSelectedPersonnelDetailId(isSelected ? '' : row.person.id)
                                }
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? 'bg-emerald-50/80' : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{row.person.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {row.person.code}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      row.person.category === 'Guru'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                                    }`}
                                  >
                                    {row.person.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-700 font-medium">
                                  {row.person.roleLabel}
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-emerald-700">
                                  {row.tepatWaktu}
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-amber-600">
                                  {row.terlambat}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-blue-600">
                                  {row.izin}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-rose-600">
                                  {row.sakit}
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-purple-600">
                                  {row.cuti}
                                </td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                                  {row.totalRecorded}
                                </td>
                                <td className="py-3 px-3 text-center font-black text-emerald-900">
                                  {row.percentage}%
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      row.percentage >= 90
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : row.percentage >= 75
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {row.percentage >= 90
                                      ? 'Teladan'
                                      : row.percentage >= 75
                                      ? 'Baik'
                                      : 'Perlu Pembinaan'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Monthly Daily Log Breakdown */}
                <div className="pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Rincian Riwayat Presensi Bulan {selectedMonthLabel}
                      {selectedPersonnelDetailId && (
                        <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 normal-case">
                          {personnelList.find((p) => p.id === selectedPersonnelDetailId)?.name}
                        </span>
                      )}
                    </h4>
                    {selectedPersonnelDetailId && (
                      <button
                        type="button"
                        onClick={() => setSelectedPersonnelDetailId('')}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Tampilkan Semua Pegawai
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-4">Tanggal</th>
                          <th className="py-2.5 px-4">Nama Pegawai</th>
                          <th className="py-2.5 px-4">Kategori</th>
                          <th className="py-2.5 px-4">Jam Masuk</th>
                          <th className="py-2.5 px-4">Jam Keluar</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPersonnelMonthLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400">
                              Belum ada riwayat presensi guru/karyawan tercatat pada bulan {selectedMonthLabel}.
                            </td>
                          </tr>
                        ) : (
                          selectedPersonnelMonthLogs.slice(0, 75).map((rec) => {
                            const matchedPerson = personnelList.find((p) => p.id === rec.teacherId);
                            const cat = matchedPerson?.category || (rec.teacherId.startsWith('stf') ? 'Karyawan' : 'Guru');
                            return (
                              <tr key={rec.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                                  {rec.date}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-slate-800">
                                  {rec.teacherName}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      cat === 'Guru'
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-sky-50 text-sky-800'
                                    }`}
                                  >
                                    {cat}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-500">
                                  {rec.time} WIB
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-500">
                                  {rec.checkOutTime ? `${rec.checkOutTime} WIB` : '-'}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                      rec.status === 'Hadir Tepat Waktu'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : rec.status === 'Terlambat'
                                        ? 'bg-amber-100 text-amber-800'
                                        : rec.status === 'Sakit'
                                        ? 'bg-rose-100 text-rose-800'
                                        : rec.status === 'Cuti'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-500">{rec.notes || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ==================== VIEW B: ABSENSI SANTRI ==================== */}
        {effectiveSubject === 'student' && (
          <>
            {/* Student KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                  % Kehadiran
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
                  {studentAttendanceRate}%
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Tingkat Keaktifan</span>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
                <span className="text-[10px] uppercase font-bold text-teal-700 block">
                  Hadir Tepat Waktu
                </span>
                <span className="text-xl sm:text-2xl font-black text-teal-950 mt-1 block">
                  {studentHadirCount}
                </span>
                <span className="text-[10px] text-teal-700 font-medium">Santri</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">
                  Terlambat
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-950 mt-1 block">
                  {studentTerlambatCount}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Lewat 07:30 WIB</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">
                  Izin / Sakit
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-950 mt-1 block">
                  {studentIzinSakitCount}
                </span>
                <span className="text-[10px] text-blue-700 font-medium">Dengan Keterangan</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">
                  Alpa / Tanpa Info
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-950 mt-1 block">
                  {studentAlpaCount}
                </span>
                <span className="text-[10px] text-rose-700 font-medium">Perlu Konfirmasi</span>
              </div>
            </div>

            {reportType === 'daily' ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Pratinjau Data Laporan Santri (Tanggal: {selectedDate})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {studentDailyFiltered.length} Baris Data
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Santri</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4">Jam</th>
                        <th className="py-3 px-4">Metode</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentDailyFiltered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Tidak ada catatan presensi santri pada tanggal / kriteria ini.
                          </td>
                        </tr>
                      ) : (
                        studentDailyFiltered.map((rec, idx) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{rec.studentName}</td>
                            <td className="py-3 px-4 text-emerald-800 font-semibold">{rec.className}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{rec.time}</td>
                            <td className="py-3 px-4 text-slate-600">{rec.method}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  rec.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'Terlambat'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{rec.notes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Rekapitulasi Bulanan Santri ({selectedMonthLabel})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {classStudents.length} Santri
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 text-center">No</th>
                        <th className="py-3 px-4">Santri</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-3 text-center">Hadir</th>
                        <th className="py-3 px-3 text-center">Telat</th>
                        <th className="py-3 px-3 text-center">Izin</th>
                        <th className="py-3 px-3 text-center">Sakit</th>
                        <th className="py-3 px-3 text-center">Alpa</th>
                        <th className="py-3 px-4 text-center">% Hadir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map((std, idx) => {
                        const sRecs = studentMonthFiltered.filter((r) => r.studentId === std.id);
                        const hadir = sRecs.filter((r) => r.status === 'Hadir').length;
                        const telat = sRecs.filter((r) => r.status === 'Terlambat').length;
                        const izin = sRecs.filter((r) => r.status === 'Izin').length;
                        const sakit = sRecs.filter((r) => r.status === 'Sakit').length;
                        const alpa = sRecs.filter((r) => r.status === 'Alpa').length;
                        const pct =
                          sRecs.length > 0
                            ? Math.min(100, Math.round(((hadir + telat) / sRecs.length) * 100))
                            : 0;
                        return (
                          <tr key={std.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{std.name}</td>
                            <td className="py-3 px-4 text-emerald-800 font-semibold">{std.className}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-700">{hadir}</td>
                            <td className="py-3 px-3 text-center font-bold text-amber-600">{telat}</td>
                            <td className="py-3 px-3 text-center text-blue-600 font-semibold">{izin}</td>
                            <td className="py-3 px-3 text-center text-rose-600 font-semibold">{sakit}</td>
                            <td className="py-3 px-3 text-center text-slate-600 font-semibold">{alpa}</td>
                            <td className="py-3 px-4 text-center font-black text-emerald-900">
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
