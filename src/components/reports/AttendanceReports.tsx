import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { exportDailyAttendancePDF, exportMonthlyAttendancePDF } from '../../services/pdfService';
import { exportDailyAttendanceExcel, exportMonthlyAttendanceExcel } from '../../services/excelService';

export const AttendanceReports: React.FC = () => {
  const { students, studentAttendance } = useApp();

  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober 2026');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const classList = ['TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'];
  const monthList = [
    'Oktober 2026',
    'September 2026',
    'Agustus 2026',
    'Juli 2026'
  ];

  // Daily records filtered
  const dailyFilteredRecords = studentAttendance.filter((r) => {
    const matchDate = r.date === selectedDate;
    const matchClass = !selectedClass || r.className === selectedClass;
    return matchDate && matchClass;
  });

  // Students in class
  const classStudents = students.filter(
    (s) => !selectedClass || s.className === selectedClass
  );

  // Statistics
  const totalStudents = classStudents.length;
  const hadirCount = dailyFilteredRecords.filter((r) => r.status === 'Hadir').length;
  const terlambatCount = dailyFilteredRecords.filter((r) => r.status === 'Terlambat').length;
  const izinSakitCount = dailyFilteredRecords.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;
  const alpaCount = dailyFilteredRecords.filter((r) => r.status === 'Alpa').length;
  const totalRecorded = dailyFilteredRecords.length;
  const attendanceRate = totalStudents > 0 ? Math.round(((hadirCount + terlambatCount) / totalStudents) * 100) : 0;

  // Handlers for Export
  const handleDownloadPDF = () => {
    if (reportType === 'daily') {
      exportDailyAttendancePDF(selectedDate, selectedClass, dailyFilteredRecords, students);
    } else {
      exportMonthlyAttendancePDF(selectedMonth, selectedClass, classStudents, studentAttendance);
    }
  };

  const handleDownloadExcel = () => {
    if (reportType === 'daily') {
      exportDailyAttendanceExcel(selectedDate, selectedClass, dailyFilteredRecords, students);
    } else {
      exportMonthlyAttendanceExcel(selectedMonth, selectedClass, classStudents, studentAttendance);
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
            Laporan Kehadiran Harian & Bulanan
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Unduh rekapitulasi presensi resmi berstempel digital sekolah dalam format PDF siap cetak atau berkas Excel (Spreadsheet).
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Unduh Format PDF
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Format Excel
          </button>
        </div>
      </div>

      {/* Filter and Period Selection Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setReportType('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                reportType === 'daily'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              Laporan Harian
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                reportType === 'monthly'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Laporan Bulanan
            </button>
          </div>

          {/* Date & Class Selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none"
                >
                  {monthList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
          </div>
        </div>

        {/* Statistics Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              % Kehadiran
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
              {attendanceRate}%
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Tingkat Keaktifan</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-center">
            <span className="text-[10px] uppercase font-bold text-teal-700 block">
              Hadir Tepat Waktu
            </span>
            <span className="text-xl sm:text-2xl font-black text-teal-950 mt-1 block">
              {hadirCount}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">Santri</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Terlambat
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-950 mt-1 block">
              {terlambatCount}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Lewat 07:30 WIB</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">
              Izin / Sakit
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-950 mt-1 block">
              {izinSakitCount}
            </span>
            <span className="text-[10px] text-blue-700 font-medium">Dengan Keterangan</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">
              Alpa / Tanpa Info
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-950 mt-1 block">
              {alpaCount}
            </span>
            <span className="text-[10px] text-rose-700 font-medium">Perlu Konfirmasi</span>
          </div>
        </div>

        {/* Live Table Preview */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Pratinjau Data Laporan ({reportType === 'daily' ? `Tanggal: ${selectedDate}` : `Bulan: ${selectedMonth}`})
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              {dailyFilteredRecords.length} Baris Data
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
                {dailyFilteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada catatan presensi pada tanggal / kriteria ini.
                    </td>
                  </tr>
                ) : (
                  dailyFilteredRecords.map((rec, idx) => (
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
      </div>
    </div>
  );
};
