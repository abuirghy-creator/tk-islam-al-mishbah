import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentAttendance } from './StudentAttendance';
import { TeacherSelfieAttendance } from './TeacherSelfieAttendance';
import {
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  ScanLine,
  Camera,
  Search,
  FileText,
  Clock,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import { getPersonCategory } from '../../utils/workSchedule';

interface StudentTeacherAttendanceMenuProps {
  onNavigateTab?: (tabKey: string) => void;
  initialSection?: 'overview' | 'students' | 'teachers';
}

type HubSection = 'overview' | 'students' | 'teachers';
type StudentFilterStatus = 'Semua' | 'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Alpa' | 'Belum Absen';
type StaffFilterRole = 'all' | 'teacher' | 'staff';

export const StudentTeacherAttendanceMenu: React.FC<StudentTeacherAttendanceMenuProps> = ({
  onNavigateTab,
  initialSection = 'overview'
}) => {
  const {
    students,
    teachers,
    staff,
    studentAttendance,
    teacherAttendance,
    leaveRequests,
    canEditSchoolData,
    syncToDatabaseNow,
    isSyncing,
    databaseSyncInfo
  } = useApp();

  const [section, setSection] = useState<HubSection>(initialSection);
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentFilterStatus>('Semua');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<StaffFilterRole>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = useMemo(() => {
    try {
      return new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  // Student Attendance Metrics Today
  const todayStudentMap = useMemo(() => {
    const map = new Map<string, (typeof studentAttendance)[number]>();
    studentAttendance.forEach((rec) => {
      if (rec.date === todayStr && !map.has(rec.studentId)) {
        map.set(rec.studentId, rec);
      }
    });
    return map;
  }, [studentAttendance, todayStr]);

  const studentStats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izinSakitAlpa = 0;
    let belum = 0;

    students.forEach((s) => {
      const rec = todayStudentMap.get(s.id);
      if (!rec) {
        belum += 1;
      } else if (rec.status === 'Hadir') {
        hadir += 1;
      } else if (rec.status === 'Terlambat') {
        terlambat += 1;
      } else {
        izinSakitAlpa += 1;
      }
    });

    const total = students.length;
    const attended = hadir + terlambat;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { total, hadir, terlambat, izinSakitAlpa, belum, attended, rate };
  }, [students, todayStudentMap]);

  // Teacher & Staff Attendance Metrics Today
  const allPersonnel = useMemo(() => {
    return [
      ...teachers.map((t) => ({
        id: t.id,
        name: t.name,
        position: t.position,
        category: getPersonCategory(t.id, staff)
      })),
      ...staff.map((st) => ({
        id: st.id,
        name: st.name,
        position: st.position,
        category: getPersonCategory(st.id, staff)
      }))
    ];
  }, [teachers, staff]);

  const todayTeacherMap = useMemo(() => {
    const map = new Map<string, (typeof teacherAttendance)[number]>();
    teacherAttendance.forEach((rec) => {
      if (rec.date === todayStr && !map.has(rec.teacherId)) {
        map.set(rec.teacherId, rec);
      }
    });
    return map;
  }, [teacherAttendance, todayStr]);

  const teacherStats = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    let terlambat = 0;

    allPersonnel.forEach((p) => {
      const rec = todayTeacherMap.get(p.id);
      if (rec) {
        if (rec.status === 'Hadir Tepat Waktu' || rec.status === 'Terlambat') checkedIn += 1;
        if (rec.status === 'Terlambat') terlambat += 1;
        if (rec.checkOutTime) checkedOut += 1;
      }
    });

    const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending').length;
    const total = allPersonnel.length;
    const belum = Math.max(0, total - todayTeacherMap.size);
    return { total, checkedIn, checkedOut, terlambat, pendingLeaves, belum };
  }, [allPersonnel, todayTeacherMap, leaveRequests]);

  // Filtered rows for Student table
  const filteredStudentRows = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students
      .map((s) => ({
        student: s,
        record: todayStudentMap.get(s.id) || null
      }))
      .filter(({ student, record }) => {
        const statusLabel: StudentFilterStatus = record ? record.status : 'Belum Absen';
        if (studentStatusFilter !== 'Semua' && statusLabel !== studentStatusFilter) {
          return false;
        }
        if (!q) return true;
        return (
          student.name.toLowerCase().includes(q) ||
          student.className.toLowerCase().includes(q) ||
          student.barcode.toLowerCase().includes(q)
        );
      });
  }, [students, todayStudentMap, studentSearch, studentStatusFilter]);

  // Filtered rows for Teacher/Staff table
  const filteredPersonnelRows = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return allPersonnel
      .map((person) => ({
        person,
        record: todayTeacherMap.get(person.id) || null
      }))
      .filter(({ person }) => {
        if (staffFilter === 'teacher' && person.category !== 'guru') return false;
        if (staffFilter === 'staff' && person.category !== 'karyawan') return false;
        if (!q) return true;
        return (
          person.name.toLowerCase().includes(q) ||
          person.position.toLowerCase().includes(q)
        );
      });
  }, [allPersonnel, todayTeacherMap, teacherSearch, staffFilter]);

  return (
    <div className="space-y-6">
      {/* Header Workspace Banner + Unified Navigation Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ClipboardCheck className="w-4 h-4" />
                Pusat Kehadiran Sekolah
              </span>
              <span aria-hidden="true">·</span>
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Menu Absensi Murid dan Guru
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Kelola presensi harian santri (barcode/QR kamera Android &amp; absen manual) serta presensi selfie masuk/keluar guru dan karyawan dalam satu menu terpadu.
            </p>
          </div>

          {/* Primary Segmented Control */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setSection('overview')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'overview'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ringkasan Hari Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setSection('students')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'students'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Absensi Murid</span>
            </button>

            <button
              type="button"
              onClick={() => setSection('teachers')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                section === 'teachers'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Absensi Guru &amp; Staf</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: UNIFIED DAILY OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-6">
          {/* 4-Column Tabular KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Kehadiran Murid</span>
                <GraduationCap className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {studentStats.attended} / {studentStats.total}
                </div>
                <span className="text-xs font-bold text-emerald-700 tabular-nums">
                  {studentStats.rate}% Hadir
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
                Tepat waktu: {studentStats.hadir} · Terlambat: {studentStats.terlambat} · Izin/Sakit/Alpa: {studentStats.izinSakitAlpa}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Murid Belum Absen</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {studentStats.belum}
                </div>
                <button
                  type="button"
                  onClick={() => setSection('students')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Mulai Scan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Scan barcode kartu atau catat manual per kelas
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Absen Masuk Guru &amp; Staf</span>
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {teacherStats.checkedIn} / {teacherStats.total}
                </div>
                <span className="text-xs font-bold text-slate-600 tabular-nums">
                  Belum: {teacherStats.belum}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
                Terlambat: {teacherStats.terlambat} · Sudah pulang (check-out): {teacherStats.checkedOut}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Pengajuan Cuti / Izin</span>
                <Clock className="w-4 h-4 text-sky-700" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {teacherStats.pendingLeaves}
                </div>
                <button
                  type="button"
                  onClick={() => setSection('teachers')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Isi Selfie / ACC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Menunggu persetujuan {canEditSchoolData ? 'Pemilik Akun' : 'Kepala Sekolah / Pemilik'}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              Akses Langsung Pencatatan &amp; Pengaturan Jadwal
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSection('students')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Buka Scanner &amp; Absen Murid</span>
              </button>

              <button
                type="button"
                onClick={() => setSection('teachers')}
                className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-700" />
                <span>Selfie Masuk / Keluar Guru</span>
              </button>

              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('schedule-guru')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jadwal Guru</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('schedule-karyawan')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jadwal Karyawan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('reports')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Laporan PDF / Excel</span>
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={isSyncing}
                onClick={async () => {
                  const res = await syncToDatabaseNow('Sinkronisasi Absensi Murid & Guru');
                  setSyncFeedback({ ok: res.success && res.cloudSynced, text: res.message });
                }}
                className={`px-3.5 py-2 border text-xs font-bold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                  databaseSyncInfo.supabaseStatus === 'connected'
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                }`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
              </button>
            </div>
          </div>

          {syncFeedback && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2 ${
                syncFeedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <span>{syncFeedback.text}</span>
              <button
                type="button"
                onClick={() => setSyncFeedback(null)}
                className="text-xs font-bold underline shrink-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Two-Column Live Attendance Tables: Murid & Guru */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Table 1: Student Attendance Today */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Daftar Absensi Murid Hari Ini
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Menampilkan {filteredStudentRows.length} dari {students.length} santri terdaftar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('students')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Catat Absensi Murid
                </button>
              </div>

              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama santri, kelas, atau kode barcode..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
                  />
                </div>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value as StudentFilterStatus)}
                  aria-label="Filter status absensi murid"
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-emerald-600"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                  <option value="Belum Absen">Belum Absen</option>
                </select>
              </div>

              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Santri &amp; Kelas</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudentRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 px-4 text-center text-slate-500">
                          <p className="font-semibold text-slate-700">
                            Tidak ada data santri yang cocok dengan filter.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSearch('');
                              setStudentStatusFilter('Semua');
                            }}
                            className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredStudentRows.map(({ student, record }) => {
                        const statusText = record ? record.status : 'Belum Absen';
                        const statusColor =
                          statusText === 'Hadir'
                            ? 'text-emerald-700'
                            : statusText === 'Terlambat'
                            ? 'text-amber-700'
                            : statusText === 'Belum Absen'
                            ? 'text-slate-400'
                            : 'text-rose-700';

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-900">{student.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {student.className} · {student.barcode}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 tabular-nums whitespace-nowrap">
                              {record ? record.time : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {record ? record.method : '—'}
                            </td>
                            <td className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${statusColor}`}>
                              {statusText === 'Hadir' && (
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                                </span>
                              )}
                              {statusText !== 'Hadir' && statusText}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Teacher & Staff Attendance Today */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Daftar Absensi Guru &amp; Karyawan Hari Ini
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Menampilkan {filteredPersonnelRows.length} dari {allPersonnel.length} pendidik &amp; staf
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('teachers')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Selfie Masuk / Keluar
                </button>
              </div>

              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Cari nama guru, karyawan, atau jabatan..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-emerald-600"
                  />
                </div>
                <div className="bg-slate-200/70 p-0.5 rounded-lg flex items-center gap-0.5 shrink-0">
                  {(
                    [
                      { key: 'all', label: 'Semua' },
                      { key: 'teacher', label: 'Guru' },
                      { key: 'staff', label: 'Karyawan' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setStaffFilter(opt.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        staffFilter === opt.key
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Nama &amp; Jabatan</th>
                      <th className="py-2.5 px-3">Masuk</th>
                      <th className="py-2.5 px-3">Keluar</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPersonnelRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 px-4 text-center text-slate-500">
                          <p className="font-semibold text-slate-700">
                            Tidak ada data guru atau karyawan yang cocok.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherSearch('');
                              setStaffFilter('all');
                            }}
                            className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredPersonnelRows.map(({ person, record }) => {
                        const statusText = record ? record.status : 'Belum Absen';
                        const statusColor =
                          statusText === 'Hadir Tepat Waktu'
                            ? 'text-emerald-700'
                            : statusText === 'Terlambat'
                            ? 'text-amber-700'
                            : statusText === 'Belum Absen'
                            ? 'text-slate-400'
                            : 'text-rose-700';

                        return (
                          <tr key={person.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-slate-900">{person.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {person.position} · {person.category === 'guru' ? 'Guru' : 'Karyawan'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 tabular-nums whitespace-nowrap">
                              {record?.time || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 tabular-nums whitespace-nowrap">
                              {record?.checkOutTime || '—'}
                            </td>
                            <td className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${statusColor}`}>
                              {statusText === 'Hadir Tepat Waktu' ? (
                                <span className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Tepat Waktu
                                </span>
                              ) : (
                                statusText
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STUDENT ATTENDANCE (BARCODE CAMERA + MANUAL + CARDS) */}
      {section === 'students' && <StudentAttendance />}

      {/* SECTION 3: TEACHER & STAFF SELFIE ATTENDANCE + LEAVES + RECAP */}
      {section === 'teachers' && <TeacherSelfieAttendance />}
    </div>
  );
};
