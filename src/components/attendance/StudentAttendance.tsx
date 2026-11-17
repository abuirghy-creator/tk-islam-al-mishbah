import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, AttendanceStatus, StudentAttendanceRecord } from '../../types';
import {
  ScanLine,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  CheckCheck,
  CreditCard,
  QrCode,
  Zap,
  Printer,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  Filter,
  CheckSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentCardModal } from '../cards/StudentCardModal';
import { ExcelImportModal } from '../master/ExcelImportModal';

export const StudentAttendance: React.FC = () => {
  const {
    students,
    studentAttendance,
    recordStudentAttendance,
    batchUpdateStudentAttendance,
    halaqohGroups,
    schoolProfile
  } = useApp();

  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'cards'>('scan');
  const [selectedClass, setSelectedClass] = useState<string>('TK A-1');
  const [selectedHalaqohFilter, setSelectedHalaqohFilter] = useState<string>('');
  const [manualViewMode, setManualViewMode] = useState<'kelas' | 'halaqoh'>('kelas');

  // Excel Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Barcode / Scanner state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
    student?: Student;
  } | null>(null);

  // Card Modal state
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Manual attendance state for current date & class/halaqoh
  const todayStr = new Date().toISOString().split('T')[0];
  const [manualStatuses, setManualStatuses] = useState<{ [studentId: string]: AttendanceStatus }>({});
  const [manualNotes, setManualNotes] = useState<{ [studentId: string]: string }>({});

  // Sync manual statuses whenever students or studentAttendance changes
  useEffect(() => {
    setManualStatuses((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        const existing = studentAttendance.find((r) => r.studentId === s.id && r.date === todayStr);
        if (existing) {
          updated[s.id] = existing.status;
        } else if (!updated[s.id]) {
          updated[s.id] = 'Hadir';
        }
      });
      return updated;
    });
  }, [students, studentAttendance, todayStr]);

  const classList = ['TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'];

  // Filter students based on active view mode and selections
  const filteredStudents = students.filter((s) => {
    if (manualViewMode === 'halaqoh' && activeTab === 'manual') {
      const matchHalaqoh = !selectedHalaqohFilter || s.halaqohGroup === selectedHalaqohFilter;
      const matchClass = !selectedClass || selectedClass === 'Semua' || s.className === selectedClass;
      return matchHalaqoh && matchClass;
    }

    const matchClass = !selectedClass || selectedClass === 'Semua' || s.className === selectedClass;
    const matchHalaqoh = !selectedHalaqohFilter || selectedHalaqohFilter === 'Semua' || s.halaqohGroup === selectedHalaqohFilter;
    return matchClass && matchHalaqoh;
  });

  // Current active halaqoh group info if in halaqoh mode
  const currentHalaqohInfo = halaqohGroups.find((g) => g.name === selectedHalaqohFilter) || halaqohGroups[0];

  // Handle Barcode Scan
  const handleProcessBarcode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const matchedStudent = students.find(
      (s) =>
        s.barcode.toUpperCase() === trimmed ||
        s.id.toUpperCase() === trimmed ||
        s.nisn === trimmed ||
        trimmed.includes(s.id.toUpperCase()) ||
        trimmed.includes(s.barcode.toUpperCase())
    );

    if (matchedStudent) {
      const now = new Date();
      const isLate = now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30);
      const status: AttendanceStatus = isLate ? 'Terlambat' : 'Hadir';

      recordStudentAttendance({
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        className: matchedStudent.className,
        status,
        method: 'Barcode Scan',
        notes: isLate ? 'Terlambat via Barcode Scanner Gerbang' : 'Presensi Barcode Tepat Waktu',
        location: {
          lat: schoolProfile.schoolCoordinates.lat,
          lng: schoolProfile.schoolCoordinates.lng,
          distanceMeters: 14,
          inRadius: true
        }
      });

      setScanMessage({
        type: isLate ? 'warning' : 'success',
        text: isLate
          ? `⚠️ Scan Berhasil: ${matchedStudent.name} tercatat TERLAMBAT (${now.toLocaleTimeString('id-ID')} WIB)`
          : `✅ Scan Berhasil: ${matchedStudent.name} HADIR (${now.toLocaleTimeString('id-ID')} WIB)`,
        student: matchedStudent
      });

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } else {
      setScanMessage({
        type: 'error',
        text: `Barcode / NIS "${trimmed}" tidak terdaftar dalam database TK Al Mishbah!`
      });
    }

    setBarcodeInput('');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessBarcode(barcodeInput);
  };

  // Manual Attendance handlers
  const handleMarkAllHadir = () => {
    const updated = { ...manualStatuses };
    filteredStudents.forEach((s) => {
      updated[s.id] = 'Hadir';
    });
    setManualStatuses(updated);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setManualStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveManualAttendance = () => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    const recordsToSave: StudentAttendanceRecord[] = filteredStudents.map((s) => ({
      id: `att-s-${s.id}-${todayStr}`,
      date: todayStr,
      time,
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      status: manualStatuses[s.id] || 'Hadir',
      method: 'Manual Guru',
      notes: manualNotes[s.id] || (manualViewMode === 'halaqoh' ? `Presensi ${s.halaqohGroup}` : `Presensi kelas ${s.className}`),
      location: {
        lat: schoolProfile.schoolCoordinates.lat,
        lng: schoolProfile.schoolCoordinates.lng,
        distanceMeters: 12,
        inRadius: true
      }
    }));

    batchUpdateStudentAttendance(recordsToSave);

    try {
      confetti({
        particleCount: 50,
        spread: 70
      });
    } catch (e) {
      // ignore
    }

    const scopeLabel = manualViewMode === 'halaqoh'
      ? `Kelompok ${selectedHalaqohFilter || 'Halaqoh'}`
      : `Kelas ${selectedClass}`;

    alert(`Alhamdulillah! Berhasil menyimpan presensi untuk ${recordsToSave.length} santri ${scopeLabel}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-700/80 rounded-lg text-amber-300">
              <ScanLine className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              Presensi Siswa Real-Time & Terhubung Database
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Presensi Barcode, Absen Kelas & Kelompok Halaqoh
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Data santri dari import Excel langsung tersinkronisasi otomatis. Santri dapat scan barcode kartu atau diabsen manual per kelas maupun per kelompok halaqoh tahfidz.
          </p>
        </div>

        {/* Action Buttons: Import Excel shortcut + View tab switch pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
            title="Import data santri dari file Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-950" />
            <span>Import Excel</span>
          </button>

          <div className="bg-black/25 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'scan'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" /> Scan Barcode / QR
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <CheckCheck className="w-4 h-4" /> Absen Manual & Halaqoh
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'cards'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Kartu Santri
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SCAN BARCODE / QR */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Scanner & Simulator */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  Pindai Barcode / QR Kartu Santri
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {students.length} Santri Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Arahkan kartu ke scanner fisik atau kamera gerbang sekolah. Santri hasil import Excel otomatis langsung dikenali oleh sistem.
              </p>

              {/* Animated Scanner Laser Viewport */}
              <div className="relative aspect-16/9 bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner flex flex-col items-center justify-center p-6 text-center text-white">
                {/* Laser animation */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

                <div className="border-2 border-dashed border-emerald-400/60 rounded-2xl w-48 h-32 flex items-center justify-center mb-3">
                  <ScanLine className="w-12 h-12 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-xs font-semibold text-emerald-200">
                  Sensor Barcode Kamera Gerbang Aktif • Siap Membaca Kode Kartu
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Mendukung Scanner USB Fisik, Barcode 1D, & QR Code 2D
                </div>
              </div>

              {/* Manual Barcode Input Form */}
              <form onSubmit={handleBarcodeSubmit} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Ketik atau tempel kode barcode (Contoh: TK-AM-202401 atau NISN)..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Scan
                </button>
              </form>

              {/* Feedback alert */}
              {scanMessage && (
                <div
                  className={`mt-4 p-4 rounded-2xl border animate-in zoom-in-95 duration-150 flex items-start gap-3 ${
                    scanMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : scanMessage.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {scanMessage.student?.photoUrl && (
                    <img
                      src={scanMessage.student.photoUrl}
                      alt={scanMessage.student.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-bold">{scanMessage.text}</p>
                    {scanMessage.student && (
                      <div className="text-[11px] mt-1 space-y-0.5 opacity-90">
                        <div>Santri: <strong>{scanMessage.student.name}</strong> ({scanMessage.student.className})</div>
                        <div>Wali Murid: {scanMessage.student.parentName} ({scanMessage.student.parentPhone})</div>
                        <div className="flex items-center gap-1 mt-1 font-semibold text-emerald-800">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Halaqoh: {scanMessage.student.halaqohGroup}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Card Simulator Buttons */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Simulasi Kartu Santri (Klik untuk Scan Instan):
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    1-Click Test
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {students.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleProcessBarcode(s.barcode)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={s.photoUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover group-hover:ring-2 ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {s.nickName || s.name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 font-semibold truncate">
                        {s.barcode}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">{s.className} • {s.halaqohGroup.split('(')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Today Attendance Feed */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Presensi Siswa Hari Ini
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {studentAttendance.length} Santri Tiba
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
              {studentAttendance.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada presensi siswa yang dicatat hari ini.
                </div>
              ) : (
                studentAttendance.map((rec) => {
                  const student = students.find((s) => s.id === rec.studentId);
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={
                          student?.photoUrl ||
                          'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={rec.studentName}
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate">
                            {rec.studentName}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {rec.time} WIB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-md ${
                              rec.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {rec.className} • {student?.halaqohGroup || 'Halaqoh'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABSEN MANUAL & KELOMPOK HALAQOH KELAS */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
          {/* Top Sub-tabs & Scope Selector */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Presensi Terstruktur Kelas & Kelompok Halaqoh
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih presensi berdasarkan Rombongan Belajar (Kelas) atau Kelompok Halaqoh Tahfidz Al-Qur'an.
              </p>
            </div>

            {/* Toggle Mode: Per Kelas vs Per Halaqoh */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setManualViewMode('kelas')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  manualViewMode === 'kelas'
                    ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mode Kelas (Rombel)</span>
              </button>
              <button
                onClick={() => {
                  setManualViewMode('halaqoh');
                  if (!selectedHalaqohFilter && halaqohGroups[0]) {
                    setSelectedHalaqohFilter(halaqohGroups[0].name);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  manualViewMode === 'halaqoh'
                    ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Mode Kelompok Halaqoh</span>
              </button>
            </div>
          </div>

          {/* Filtering and Actions Bar */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {manualViewMode === 'kelas' ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Pilih Kelas:</span>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600 shadow-2xs"
                    >
                      <option value="Semua">Semua Kelas ({students.length} Santri)</option>
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          Kelas {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Halaqoh:</span>
                    <select
                      value={selectedHalaqohFilter}
                      onChange={(e) => setSelectedHalaqohFilter(e.target.value)}
                      className="text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600 shadow-2xs max-w-[200px] truncate"
                    >
                      <option value="">Semua Halaqoh</option>
                      {halaqohGroups.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Pilih Kelompok Halaqoh:</span>
                    <select
                      value={selectedHalaqohFilter || halaqohGroups[0]?.name}
                      onChange={(e) => setSelectedHalaqohFilter(e.target.value)}
                      className="text-xs font-bold bg-white border border-emerald-400 text-emerald-950 rounded-xl px-3 py-2 focus:outline-emerald-600 shadow-2xs"
                    >
                      {halaqohGroups.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter Kelas:</span>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600 shadow-2xs"
                    >
                      <option value="Semua">Semua Kelas</option>
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          Kelas {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleMarkAllHadir}
                className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" /> Hadirkan Semua ({filteredStudents.length})
              </button>

              <button
                onClick={handleSaveManualAttendance}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan Presensi
              </button>
            </div>
          </div>

          {/* Halaqoh Header Info Card (when in Halaqoh mode) */}
          {manualViewMode === 'halaqoh' && currentHalaqohInfo && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center font-bold text-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {currentHalaqohInfo.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pembimbing / Musyrifah: <strong>{currentHalaqohInfo.mentorName}</strong> • {currentHalaqohInfo.room} • {currentHalaqohInfo.scheduleTime}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-500 block">Total Santri di Halaqoh Ini</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {students.filter((s) => s.halaqohGroup === currentHalaqohInfo.name).length} Santri Terdaftar
                </span>
              </div>
            </div>
          )}

          {/* Students Attendance Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Kelas & Barcode</th>
                    <th className="py-3 px-4">Kelompok Halaqoh</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Catatan Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Tidak ada santri yang sesuai dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={std.photoUrl}
                              alt={std.name}
                              className="w-10 h-10 rounded-xl object-cover border border-emerald-300 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{std.name}</div>
                              <div className="text-[10px] text-slate-500">
                                Wali: {std.parentName} ({std.parentPhone})
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold block w-fit mb-1">
                            {std.className}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600">{std.barcode}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-emerald-900 font-medium text-[11px]">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[170px]" title={std.halaqohGroup}>
                              {std.halaqohGroup}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {(['Hadir', 'Sakit', 'Izin', 'Terlambat', 'Alpa'] as AttendanceStatus[]).map(
                              (status) => {
                                const isSelected = (manualStatuses[std.id] || 'Hadir') === status;
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(std.id, status)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? status === 'Hadir'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : status === 'Terlambat'
                                          ? 'bg-amber-600 text-white shadow-xs'
                                          : status === 'Alpa'
                                          ? 'bg-rose-600 text-white shadow-xs'
                                          : 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Catatan keaktifan..."
                            value={manualNotes[std.id] || ''}
                            onChange={(e) =>
                              setManualNotes({ ...manualNotes, [std.id]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600 focus:bg-white"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KARTU SANTRI BER-BARCODE */}
      {activeTab === 'cards' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Pusat Cetak Kartu Santri Ber-Barcode Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Kartu tanda pengenal otomatis terhubung ke sistem scanner gerbang dan kelompok halaqoh masing-masing anak.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600"
              >
                <option value="Semua">Semua Kelas</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedHalaqohFilter}
                onChange={(e) => setSelectedHalaqohFilter(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600 max-w-[180px] truncate"
              >
                <option value="">Semua Halaqoh</option>
                {halaqohGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.shortName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((std) => (
              <div
                key={std.id}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/30 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={std.photoUrl}
                    alt={std.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                        {std.className}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-1">
                      {std.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">NISN: {std.nisn}</p>
                    <p className="text-[10px] text-emerald-800 font-medium truncate mt-0.5">
                      📖 {std.halaqohGroup}
                    </p>
                  </div>
                </div>

                {/* Barcode visual preview & print button */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-slate-700 tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">
                    ||| {std.barcode} |||
                  </div>
                  <button
                    onClick={() => setSelectedStudentForCard(std)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Kartu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student ID Card Print Modal */}
      {selectedStudentForCard && (
        <StudentCardModal
          student={selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
        />
      )}

      {/* Excel Import Modal */}
      {isExcelModalOpen && (
        <ExcelImportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          targetType="student"
        />
      )}
    </div>
  );
};
