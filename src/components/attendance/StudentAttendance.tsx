import React, { useState, useEffect, useMemo } from 'react';
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
  FileSpreadsheet,
  BookOpen,
  ClipboardEdit,
  UserCheck,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentCardModal } from '../cards/StudentCardModal';
import { ExcelImportModal } from '../master/ExcelImportModal';

const STATUS_LIST: AttendanceStatus[] = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa'];

const QUICK_MANUAL_NOTES = [
  'Lupa membawa kartu barcode',
  'Kartu barcode rusak / tidak terbaca',
  'Izin acara keluarga',
  'Sakit / istirahat di rumah',
  'Diantar langsung oleh wali murid'
];

export const StudentAttendance: React.FC = () => {
  const {
    students,
    studentAttendance,
    recordStudentAttendance,
    batchUpdateStudentAttendance,
    halaqohGroups,
    schoolProfile,
    canManageMasterData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'cards'>('scan');
  const [selectedClass, setSelectedClass] = useState<string>('TK A-1');
  const [selectedHalaqohFilter, setSelectedHalaqohFilter] = useState<string>('');
  const [manualViewMode, setManualViewMode] = useState<'kelas' | 'halaqoh'>('kelas');

  // Barcode Tab sub-mode: Scan Barcode vs Manual Input (Tanpa Kartu)
  const [scanPanelMode, setScanPanelMode] = useState<'barcode' | 'manual'>('barcode');
  const [feedViewMode, setFeedViewMode] = useState<'attended' | 'unscanned'>('attended');
  const [feedSearch, setFeedSearch] = useState<string>('');
  const [manualQuickClass, setManualQuickClass] = useState<string>('Semua');
  const [manualQuickSearch, setManualQuickSearch] = useState<string>('');
  const [manualQuickStudentId, setManualQuickStudentId] = useState<string>('');
  const [manualQuickStatus, setManualQuickStatus] = useState<AttendanceStatus>('Hadir');
  const [manualQuickNote, setManualQuickNote] = useState<string>('Lupa membawa kartu barcode');

  // Excel Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Barcode / Scanner state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
    student?: Student;
  } | null>(null);

  // Manual batch feedback banner
  const [manualSaveMessage, setManualSaveMessage] = useState<string | null>(null);
  const [manualTableSearch, setManualTableSearch] = useState<string>('');

  // Card Modal state
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  // Manual attendance state for current date & class/halaqoh
  const todayStr = new Date().toISOString().split('T')[0];
  const [manualStatuses, setManualStatuses] = useState<{ [studentId: string]: AttendanceStatus }>({});
  const [manualNotes, setManualNotes] = useState<{ [studentId: string]: string }>({});

  const classList = useMemo(() => {
    const defaults = ['TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'];
    const dynamic = students.map((s) => s.className).filter(Boolean);
    return Array.from(new Set([...defaults, ...dynamic]));
  }, [students]);

  // Sync manual statuses & notes whenever students or studentAttendance changes
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

  // Today's student attendance records
  const todayRecords = useMemo(() => {
    return studentAttendance.filter((r) => r.date === todayStr);
  }, [studentAttendance, todayStr]);

  const todayRecordByStudentId = useMemo(() => {
    const map = new Map<string, StudentAttendanceRecord>();
    todayRecords.forEach((r) => {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, r);
      }
    });
    return map;
  }, [todayRecords]);

  // Students who have NOT attended today
  const unscannedStudents = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (todayRecordByStudentId.has(s.id)) return false;
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query) ||
        s.barcode.toLowerCase().includes(query) ||
        s.nisn.toLowerCase().includes(query)
      );
    });
  }, [students, todayRecordByStudentId, feedSearch]);

  const filteredTodayRecords = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    if (!query) return todayRecords;
    return todayRecords.filter(
      (r) =>
        r.studentName.toLowerCase().includes(query) ||
        r.className.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        r.method.toLowerCase().includes(query)
    );
  }, [todayRecords, feedSearch]);

  // Candidate students for the Barcode Tab's Quick Manual Form
  const manualQuickCandidates = useMemo(() => {
    const q = manualQuickSearch.trim().toLowerCase();
    return students.filter((s) => {
      const matchClass = manualQuickClass === 'Semua' || s.className === manualQuickClass;
      if (!matchClass) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        s.barcode.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, manualQuickClass, manualQuickSearch]);

  // Keep selected student synced in quick manual form
  useEffect(() => {
    if (manualQuickCandidates.length === 0) {
      setManualQuickStudentId('');
      return;
    }
    const exists = manualQuickCandidates.some((s) => s.id === manualQuickStudentId);
    if (!exists) {
      const firstUnscanned = manualQuickCandidates.find((s) => !todayRecordByStudentId.has(s.id));
      setManualQuickStudentId((firstUnscanned || manualQuickCandidates[0]).id);
    }
  }, [manualQuickCandidates, manualQuickStudentId, todayRecordByStudentId]);

  const selectedQuickStudent = students.find((s) => s.id === manualQuickStudentId) || null;

  // Filter students for Tab 2 & Tab 3
  const filteredStudents = students.filter((s) => {
    const query = manualTableSearch.trim().toLowerCase();
    const matchQuery =
      activeTab !== 'manual' ||
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.barcode.toLowerCase().includes(query) ||
      s.parentName.toLowerCase().includes(query);

    if (!matchQuery) return false;

    if (manualViewMode === 'halaqoh' && activeTab === 'manual') {
      const matchHalaqoh = !selectedHalaqohFilter || s.halaqohGroup === selectedHalaqohFilter;
      const matchClass = !selectedClass || selectedClass === 'Semua' || s.className === selectedClass;
      return matchHalaqoh && matchClass;
    }

    const matchClass = !selectedClass || selectedClass === 'Semua' || s.className === selectedClass;
    const matchHalaqoh =
      !selectedHalaqohFilter ||
      selectedHalaqohFilter === 'Semua' ||
      s.halaqohGroup === selectedHalaqohFilter;
    return matchClass && matchHalaqoh;
  });

  // Current active halaqoh group info if in halaqoh mode
  const currentHalaqohInfo =
    halaqohGroups.find((g) => g.name === selectedHalaqohFilter) || halaqohGroups[0];

  // Record Manual Attendance for a single student (inside Barcode Tab)
  const handleManualSingleRecord = (
    student: Student,
    status: AttendanceStatus,
    customNote?: string
  ) => {
    const now = new Date();
    const noteText =
      (customNote !== undefined ? customNote : manualQuickNote).trim() ||
      (status === 'Hadir'
        ? 'Absensi manual guru (tanpa scan kartu barcode)'
        : `Absensi manual guru (${status})`);

    recordStudentAttendance({
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      status,
      method: 'Manual Guru',
      notes: noteText,
      location: {
        lat: schoolProfile.schoolCoordinates.lat,
        lng: schoolProfile.schoolCoordinates.lng,
        distanceMeters: 12,
        inRadius: true
      }
    });

    setScanMessage({
      type: status === 'Terlambat' ? 'warning' : status === 'Alpa' ? 'error' : 'success',
      text: `Absen Manual Tercatat: ${student.name} berstatus ${status.toUpperCase()} (${now.toLocaleTimeString('id-ID')} WIB)`,
      student
    });

    if (status === 'Hadir' || status === 'Terlambat') {
      try {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.65 }
        });
      } catch {
        // ignore
      }
    }
  };

  const handleQuickManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickStudent) return;
    handleManualSingleRecord(selectedQuickStudent, manualQuickStatus, manualQuickNote);
  };

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
      } catch {
        // ignore
      }
    } else {
      setScanMessage({
        type: 'error',
        text: `Barcode / NIS "${trimmed}" tidak terdaftar dalam database TK Al Mishbah! Gunakan fitur Absensi Manual jika santri lupa membawa kartu.`
      });
    }

    setBarcodeInput('');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessBarcode(barcodeInput);
  };

  // Manual Attendance handlers (Tab 2)
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
      notes:
        manualNotes[s.id] ||
        (manualViewMode === 'halaqoh'
          ? `Presensi ${s.halaqohGroup}`
          : `Presensi kelas ${s.className}`),
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
    } catch {
      // ignore
    }

    const scopeLabel =
      manualViewMode === 'halaqoh'
        ? `Kelompok ${selectedHalaqohFilter || 'Halaqoh'}`
        : selectedClass === 'Semua'
        ? 'Semua Kelas'
        : `Kelas ${selectedClass}`;

    setManualSaveMessage(
      `Berhasil menyimpan presensi manual untuk ${recordsToSave.length} santri (${scopeLabel}) pada pukul ${time} WIB.`
    );
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
            Presensi Barcode, Absen Manual & Kelompok Halaqoh
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Santri dapat scan barcode kartu atau langsung dicatat secara manual oleh guru di gerbang/kelas jika tidak membawa kartu, maupun per kelompok halaqoh.
          </p>
        </div>

        {/* Action Buttons: Import Excel shortcut (Pemilik Akun) + View tab switch pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {canManageMasterData && (
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              title="Import data santri dari file Excel (Hanya Pemilik Akun)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-950" />
              <span>Import Excel</span>
            </button>
          )}

          <div className="bg-black/25 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" /> Scan Barcode & Manual
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white text-emerald-900 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <CheckCheck className="w-4 h-4" /> Absen Massal & Halaqoh
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* TAB 1: SCAN BARCODE / QR + ABSENSI MANUAL TERINTEGRASI */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Scanner & Integrated Manual Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
              {/* Header + Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    {scanPanelMode === 'barcode' ? (
                      <>
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        Pindai Barcode / QR Kartu Santri
                      </>
                    ) : (
                      <>
                        <ClipboardEdit className="w-5 h-5 text-amber-600" />
                        Absensi Manual Santri (Tanpa Kartu)
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {scanPanelMode === 'barcode'
                      ? 'Arahkan kartu ke scanner fisik/kamera gerbang atau alihkan ke Absensi Manual jika kartu tidak terbawa.'
                      : 'Catat kehadiran, keterlambatan, izin, atau sakit langsung dari pos barcode tanpa harus memindai kartu.'}
                  </p>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setScanPanelMode('barcode')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scanPanelMode === 'barcode'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ScanLine className="w-3.5 h-3.5" /> Scan Barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanPanelMode('manual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      scanPanelMode === 'manual'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardEdit className="w-3.5 h-3.5" /> Absen Manual
                  </button>
                </div>
              </div>

              {scanPanelMode === 'barcode' ? (
                <>
                  {/* Animated Scanner Laser Viewport */}
                  <div className="relative aspect-16/9 bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-500/40">
                      {students.length} Santri Terdaftar
                    </div>
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
                  <form onSubmit={handleBarcodeSubmit} className="mt-4 flex flex-wrap sm:flex-nowrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
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
                    <button
                      type="button"
                      onClick={() => setScanPanelMode('manual')}
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Catat presensi secara manual jika siswa tidak membawa kartu barcode"
                    >
                      <ClipboardEdit className="w-4 h-4 text-amber-700" /> Tanpa Kartu
                    </button>
                  </form>
                </>
              ) : (
                /* INTEGRATED MANUAL ATTENDANCE FORM INSIDE BARCODE TAB */
                <form
                  onSubmit={handleQuickManualSubmit}
                  className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Filter Kelas
                      </label>
                      <select
                        value={manualQuickClass}
                        onChange={(e) => setManualQuickClass(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-emerald-600"
                      >
                        <option value="Semua">Semua Kelas ({students.length} Santri)</option>
                        {classList.map((c) => (
                          <option key={c} value={c}>
                            Kelas {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Cari Nama / NISN / Barcode Santri
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={manualQuickSearch}
                          onChange={(e) => setManualQuickSearch(e.target.value)}
                          placeholder="Ketik nama atau NISN..."
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Pilih Santri ({manualQuickCandidates.length} ditemukan)
                      </label>
                      {selectedQuickStudent && todayRecordByStudentId.has(selectedQuickStudent.id) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Status hari ini: {todayRecordByStudentId.get(selectedQuickStudent.id)?.status}
                        </span>
                      )}
                    </div>
                    <select
                      value={manualQuickStudentId}
                      onChange={(e) => setManualQuickStudentId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600"
                    >
                      {manualQuickCandidates.length === 0 ? (
                        <option value="">Tidak ada santri cocok dengan pencarian</option>
                      ) : (
                        manualQuickCandidates.map((s) => {
                          const existing = todayRecordByStudentId.get(s.id);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} — {s.className} ({s.barcode})
                              {existing ? ` [${existing.status}]` : ' [Belum Absen]'}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  {selectedQuickStudent && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                      <img
                        src={selectedQuickStudent.photoUrl}
                        alt={selectedQuickStudent.name}
                        className="w-11 h-11 rounded-xl object-cover border border-emerald-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {selectedQuickStudent.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {selectedQuickStudent.className} • NISN: {selectedQuickStudent.nisn} •{' '}
                          <span className="font-mono text-emerald-700">{selectedQuickStudent.barcode}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Status Kehadiran Manual
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {STATUS_LIST.map((status) => {
                        const isActive = manualQuickStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setManualQuickStatus(status)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isActive
                                ? status === 'Hadir'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : status === 'Terlambat'
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                                  : status === 'Alpa'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Alasan / Keterangan Manual
                    </label>
                    <input
                      type="text"
                      value={manualQuickNote}
                      onChange={(e) => setManualQuickNote(e.target.value)}
                      placeholder="Contoh: Lupa membawa kartu barcode / Izin orang tua..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-emerald-600"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {QUICK_MANUAL_NOTES.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setManualQuickNote(preset)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            manualQuickNote === preset
                              ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setScanPanelMode('barcode')}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      Kembali ke Scanner
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedQuickStudent}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" /> Catat Absen Manual
                    </button>
                  </div>
                </form>
              )}

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
                        <div>
                          Santri: <strong>{scanMessage.student.name}</strong> ({scanMessage.student.className})
                        </div>
                        <div>
                          Wali Murid: {scanMessage.student.parentName} ({scanMessage.student.parentPhone})
                        </div>
                        <div className="flex items-center gap-1 mt-1 font-semibold text-emerald-800">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Halaqoh: {scanMessage.student.halaqohGroup}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Card Simulator Buttons (only in barcode mode) */}
              {scanPanelMode === 'barcode' && (
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
                        type="button"
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
                        <div className="text-[9px] text-slate-500 truncate">
                          {s.className} • {s.halaqohGroup.split('(')[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Today Attendance Feed & Quick Manual Check-In for Unscanned Students */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Presensi Hari Ini ({todayStr})
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {todayRecords.length}/{students.length} Tercatat
              </span>
            </div>

            {/* Sub-tabs: Sudah Absen vs Belum Absen (Manual Cepat) */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setFeedViewMode('attended')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  feedViewMode === 'attended'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sudah Absen ({todayRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedViewMode('unscanned')}
                className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  feedViewMode === 'unscanned'
                    ? 'bg-white text-amber-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Belum Absen ({Math.max(0, students.length - todayRecords.length)})
              </button>
            </div>

            {/* Search bar inside right panel */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder={
                  feedViewMode === 'attended'
                    ? 'Cari santri yang sudah absen...'
                    : 'Cari santri untuk absen manual cepat...'
                }
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 focus:bg-white"
              />
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {feedViewMode === 'attended' ? (
                filteredTodayRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Belum ada presensi siswa yang tercatat hari ini.
                  </div>
                ) : (
                  filteredTodayRecords.map((rec) => {
                    const student = students.find((s) => s.id === rec.studentId);
                    return (
                      <div
                        key={rec.id}
                        className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2"
                      >
                        <div className="flex items-center gap-3">
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
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  rec.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rec.status === 'Terlambat'
                                    ? 'bg-amber-100 text-amber-800'
                                    : rec.status === 'Alpa'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {rec.status}
                              </span>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                                  rec.method === 'Barcode Scan'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-amber-100/80 text-amber-900'
                                }`}
                              >
                                {rec.method}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium truncate">
                                {rec.className}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick inline status adjustment */}
                        {student && (
                          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/70">
                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]" title={rec.notes}>
                              {rec.notes || 'Tanpa catatan'}
                            </span>
                            <select
                              value={rec.status}
                              onChange={(e) =>
                                handleManualSingleRecord(
                                  student,
                                  e.target.value as AttendanceStatus,
                                  `Koreksi manual status menjadi ${e.target.value}`
                                )
                              }
                              aria-label={`Ubah status ${rec.studentName}`}
                              className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-emerald-600 cursor-pointer"
                            >
                              {STATUS_LIST.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : unscannedStudents.length === 0 ? (
                <div className="text-center py-12 text-emerald-700 font-semibold text-xs">
                  Alhamdulillah, semua santri pada filter ini sudah tercatat absensinya hari ini.
                </div>
              ) : (
                unscannedStudents.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-9 h-9 rounded-xl object-cover border border-amber-300 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{s.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {s.className} • <span className="font-mono">{s.barcode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {STATUS_LIST.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            handleManualSingleRecord(
                              s,
                              st,
                              st === 'Hadir'
                                ? 'Absen manual cepat (tanpa kartu barcode)'
                                : `Absen manual cepat (${st})`
                            )
                          }
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                            st === 'Hadir'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              : st === 'Terlambat'
                              ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-400'
                              : st === 'Alpa'
                              ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border-rose-200'
                              : 'bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
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
                  Presensi Manual Kelas & Kelompok Halaqoh
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih presensi massal berdasarkan Rombongan Belajar (Kelas) atau Kelompok Halaqoh Tahfidz Al-Qur'an.
              </p>
            </div>

            {/* Toggle Mode: Per Kelas vs Per Halaqoh */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setManualViewMode('kelas')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  manualViewMode === 'kelas'
                    ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mode Kelas (Rombel)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualViewMode('halaqoh');
                  if (!selectedHalaqohFilter && halaqohGroups[0]) {
                    setSelectedHalaqohFilter(halaqohGroups[0].name);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
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

          {manualSaveMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{manualSaveMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setManualSaveMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold text-xs px-2 py-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Filtering and Actions Bar */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={manualTableSearch}
                  onChange={(e) => setManualTableSearch(e.target.value)}
                  placeholder="Cari santri / barcode..."
                  className="pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-emerald-600 w-44 sm:w-52"
                />
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" /> Hadirkan Semua ({filteredStudents.length})
              </button>

              <button
                type="button"
                onClick={handleSaveManualAttendance}
                disabled={filteredStudents.length === 0}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
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
                  <h4 className="text-sm font-bold text-slate-900">{currentHalaqohInfo.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pembimbing / Musyrifah: <strong>{currentHalaqohInfo.mentorName}</strong> •{' '}
                    {currentHalaqohInfo.room} • {currentHalaqohInfo.scheduleTime}
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
                    filteredStudents.map((std) => {
                      const existingToday = todayRecordByStudentId.get(std.id);
                      return (
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
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {std.className}
                              </span>
                              {existingToday && (
                                <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-semibold">
                                  {existingToday.method}
                                </span>
                              )}
                            </div>
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
                              {STATUS_LIST.map((status) => {
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
                              })}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={existingToday?.notes || 'Catatan keaktifan...'}
                              value={manualNotes[std.id] || ''}
                              onChange={(e) =>
                                setManualNotes({ ...manualNotes, [std.id]: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-emerald-600 focus:bg-white"
                            />
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
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-1">{std.name}</h4>
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
                    type="button"
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

      {/* Excel Import Modal (Pemilik Akun Only) */}
      {isExcelModalOpen && canManageMasterData && (
        <ExcelImportModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          targetType="student"
        />
      )}
    </div>
  );
};
